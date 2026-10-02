"""
OR-Tools CP-SAT optimizer for the AI Timetable Agent.

Encodes hard + soft constraints and solves via CP-SAT.
"""
from ortools.sat.python import cp_model


# ── Constants ──────────────────────────────────────────────────────────────
NUM_DAYS  = 5   # Monday–Friday
NUM_SLOTS = 6   # 6 one-hour slots: 0=10-11, 1=11-12, 2=12:40-1:40, 3=1:40-2:40, 4=2:50-3:50, 5=3:50-4:50
# Labs must start at an EVEN slot (0,2,4) — these are the 3 two-hour lab windows
LAB_STARTS = (0, 2, 4)


class TimetableOptimizer:
    """
    Given teachers, subjects, classrooms, divisions and requirements,
    builds a CP-SAT model and returns a list of assignment dicts or None.
    """

    def __init__(self, teachers, subjects, classrooms, divisions,
                 requirements, teacher_avail, classroom_avail):
        """
        teachers     : [{"id":…, "name":…}]
        subjects     : [{"id":…, "name":…, "is_lab":0/1}]
        classrooms   : [{"id":…, "name":…, "is_lab":0/1}]
        divisions    : [{"id":…, "name":…}]
        requirements : [{"division_id":…,"subject_id":…,"teacher_id":…,"sessions_per_week":…}]
        teacher_avail   : {(teacher_id, day, slot): bool}
        classroom_avail : {(classroom_id, day, slot): bool}
        """
        self.teachers     = teachers
        self.subjects     = {s["id"]: s for s in subjects}
        self.classrooms   = classrooms
        self.divisions    = divisions
        self.requirements = requirements
        self.teacher_avail    = teacher_avail
        self.classroom_avail  = classroom_avail

        # Fast look-up lists
        self.teacher_ids   = [t["id"] for t in teachers]
        self.classroom_ids = [c["id"] for c in classrooms]
        self.division_ids  = [d["id"] for d in divisions]

        # req index: (division_id, subject_id) → requirement
        self.req_map = {
            (r["division_id"], r["subject_id"]): r
            for r in requirements
        }

    # ── Public entry-point ──────────────────────────────────────────────────

    def solve(self, time_limit_seconds=60):
        """
        Returns (entries, score) where:
          entries : list of {division_id,day,slot,subject_id,teacher_id,classroom_id,
                             slot_span}   (slot_span=1 theory, 2 lab)
          score   : float 0-100
        or raises RuntimeError on infeasibility.

        Lab subjects (is_lab=1) are scheduled as a 2-hour block.
        Valid lab start slots are 0, 2, 4 (each pair = 10-12, 12:40-2:40, 2:50-4:50).
        The entry records the FIRST slot; slot_span=2 means it occupies slot and slot+1.
        """
        model  = cp_model.CpModel()
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        solver.parameters.num_search_workers  = 4

        # ── Decision variables ──────────────────────────────────────────────
        # For theory: x[(div_id, sub_id, day, slot, cr_id)] = assigned to that slot
        # For lab:    x[(div_id, sub_id, day, slot, cr_id)] = block STARTS at slot
        #             slot must satisfy slot+1 < NUM_SLOTS (fits within day)
        x = {}
        for req in self.requirements:
            div_id  = req["division_id"]
            sub_id  = req["subject_id"]
            tea_id  = req["teacher_id"]
            is_lab  = bool(self.subjects[sub_id].get("is_lab", 0))
            # labs can only start at even slots (0, 2, 4) — the defined 2-hr lab windows
            valid_slots = LAB_STARTS if is_lab else range(NUM_SLOTS)

            for day in range(NUM_DAYS):
                for slot in valid_slots:
                    for cr in self.classrooms:
                        cr_id = cr["id"]
                        # Filter: lab ↔ lab classroom
                        if is_lab and not cr.get("is_lab"):
                            continue
                        if not is_lab and cr.get("is_lab"):
                            continue
                        # Teacher available for slot (and slot+1 for lab)
                        if not self.teacher_avail.get((tea_id, day, slot), True):
                            continue
                        if is_lab and not self.teacher_avail.get((tea_id, day, slot + 1), True):
                            continue
                        # Classroom available for slot (and slot+1 for lab)
                        if not self.classroom_avail.get((cr_id, day, slot), True):
                            continue
                        if is_lab and not self.classroom_avail.get((cr_id, day, slot + 1), True):
                            continue
                        key = (div_id, sub_id, day, slot, cr_id)
                        x[key] = model.NewBoolVar(
                            f"x_d{div_id}_s{sub_id}_d{day}_t{slot}_r{cr_id}"
                        )

        # ── Hard Constraint 4: Each (div, sub) gets exactly sessions_per_week ──
        for req in self.requirements:
            div_id = req["division_id"]
            sub_id = req["subject_id"]
            spw    = req["sessions_per_week"]
            vars_for_req = [
                x[k] for k in x if k[0] == div_id and k[1] == sub_id
            ]
            if not vars_for_req:
                raise RuntimeError(
                    f"No feasible slots for division={div_id} subject={sub_id}. "
                    "Check teacher/classroom availability."
                )
            model.Add(sum(vars_for_req) == spw)

        # ── Hard Constraint 3: Division has at most 1 subject per (day, slot) ──
        # For lab blocks, a block starting at slot S occupies slots S and S+1.
        for div_id in self.division_ids:
            for day in range(NUM_DAYS):
                for slot in range(NUM_SLOTS):
                    vars_slot = []
                    for k in x:
                        if k[0] != div_id or k[2] != day:
                            continue
                        sub_id  = k[1]
                        is_lab  = bool(self.subjects[sub_id].get("is_lab", 0))
                        k_slot  = k[3]
                        # occupies this slot if: theory at slot, or lab starting at slot or slot-1
                        if (not is_lab and k_slot == slot) or \
                           (is_lab and k_slot in (slot, slot - 1)):
                            vars_slot.append(x[k])
                    if vars_slot:
                        model.Add(sum(vars_slot) <= 1)

        # ── Hard Constraint 1: Teacher teaches at most 1 division per (day, slot) ──
        for tea_id in set(r["teacher_id"] for r in self.requirements):
            for day in range(NUM_DAYS):
                for slot in range(NUM_SLOTS):
                    vars_tea = []
                    for k in x:
                        sub_id = k[1]
                        is_lab = bool(self.subjects[sub_id].get("is_lab", 0))
                        k_slot = k[3]
                        if self.req_map.get((k[0], k[1]), {}).get("teacher_id") != tea_id:
                            continue
                        if k[2] != day:
                            continue
                        if (not is_lab and k_slot == slot) or \
                           (is_lab and k_slot in (slot, slot - 1)):
                            vars_tea.append(x[k])
                    if vars_tea:
                        model.Add(sum(vars_tea) <= 1)

        # ── Hard Constraint 2: Classroom used by at most 1 division per (day, slot) ──
        for cr in self.classrooms:
            cr_id = cr["id"]
            for day in range(NUM_DAYS):
                for slot in range(NUM_SLOTS):
                    vars_cr = []
                    for k in x:
                        if k[4] != cr_id or k[2] != day:
                            continue
                        sub_id = k[1]
                        is_lab = bool(self.subjects[sub_id].get("is_lab", 0))
                        k_slot = k[3]
                        if (not is_lab and k_slot == slot) or \
                           (is_lab and k_slot in (slot, slot - 1)):
                            vars_cr.append(x[k])
                    if vars_cr:
                        model.Add(sum(vars_cr) <= 1)

        # ── Soft Constraint: spread sessions across days (maximize spread) ──
        spread_bonus = []
        for req in self.requirements:
            div_id = req["division_id"]
            sub_id = req["subject_id"]
            for day in range(NUM_DAYS):
                day_vars = [x[k] for k in x if k[0] == div_id and k[1] == sub_id and k[2] == day]
                if day_vars:
                    has_session_on_day = model.NewBoolVar(f"spread_d{div_id}_s{sub_id}_day{day}")
                    model.AddMaxEquality(has_session_on_day, day_vars)
                    spread_bonus.append(has_session_on_day)

        model.Maximize(sum(spread_bonus))

        # ── Solve ───────────────────────────────────────────────────────────
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            raise RuntimeError(
                "CP-SAT could not find a feasible timetable. "
                "Try relaxing availability constraints."
            )

        # ── Extract solution ────────────────────────────────────────────────
        entries = []
        for k, var in x.items():
            if solver.Value(var) == 1:
                div_id, sub_id, day, slot, cr_id = k
                req    = self.req_map[(div_id, sub_id)]
                is_lab = bool(self.subjects[sub_id].get("is_lab", 0))
                entries.append({
                    "division_id":  div_id,
                    "subject_id":   sub_id,
                    "teacher_id":   req["teacher_id"],
                    "day":          day,
                    "slot":         slot,
                    "slot_span":    2 if is_lab else 1,
                    "classroom_id": cr_id,
                })

        # ── Compute optimization score ──────────────────────────────────────
        score = self._compute_score(entries, solver, spread_bonus)
        return entries, score

    # ── Score calculation ───────────────────────────────────────────────────

    def _compute_score(self, entries, solver, spread_bonus):
        """
        0-100 score based on:
          - 60 pts: all required sessions scheduled (checked by constraint)
          - 30 pts: spread across days
          - 10 pts: no back-to-back same-teacher (soft)
        """
        # Spread score (max possible = num_reqs × NUM_DAYS but capped)
        spread_achieved = sum(solver.Value(v) for v in spread_bonus)
        spread_max      = len(self.requirements) * NUM_DAYS
        spread_score    = (spread_achieved / max(spread_max, 1)) * 30

        # Back-to-back penalty
        penalty = 0
        teacher_slots = {}
        for e in entries:
            tea_id = e["teacher_id"]
            day    = e["day"]
            slot   = e["slot"]
            teacher_slots.setdefault((tea_id, day), []).append(slot)
        for slots in teacher_slots.values():
            slots.sort()
            for i in range(len(slots) - 1):
                if slots[i + 1] == slots[i] + 1:
                    penalty += 1
        penalty_score = max(0, 10 - penalty)

        return round(60 + spread_score + penalty_score, 2)
