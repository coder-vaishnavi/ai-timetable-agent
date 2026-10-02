"""
Constraint validator for the AI Timetable Agent.

Validates hard constraints BEFORE and AFTER generation.
"""


class ValidationError(Exception):
    pass


class ConstraintValidator:
    """Validates scheduling inputs and generated timetable entries."""

    def __init__(self, teachers, subjects, classrooms, divisions, requirements):
        """
        teachers    : list of teacher dicts (id, name, max_hours)
        subjects    : list of subject dicts (id, name, is_lab)
        classrooms  : list of classroom dicts (id, name, is_lab, capacity)
        divisions   : list of division dicts (id, name)
        requirements: list of requirement dicts (division_id, subject_id, teacher_id, sessions_per_week)
        """
        self.teachers = {t["id"]: t for t in teachers}
        self.subjects = {s["id"]: s for s in subjects}
        self.classrooms = {c["id"]: c for c in classrooms}
        self.divisions = {d["id"]: d for d in divisions}
        self.requirements = requirements

    # ── Pre-generation validation ───────────────────────────────────────────

    def validate_inputs(self):
        """Return list of error strings (empty = valid)."""
        errors = []

        if not self.teachers:
            errors.append("No teachers defined.")
        if not self.subjects:
            errors.append("No subjects defined.")
        if not self.classrooms:
            errors.append("No classrooms defined.")
        if not self.divisions:
            errors.append("No divisions defined.")
        if not self.requirements:
            errors.append("No subject requirements defined.")

        # Check each requirement references valid entities
        for req in self.requirements:
            if req["division_id"] not in self.divisions:
                errors.append(f"Requirement references unknown division id={req['division_id']}.")
            if req["subject_id"] not in self.subjects:
                errors.append(f"Requirement references unknown subject id={req['subject_id']}.")
            if req["teacher_id"] not in self.teachers:
                errors.append(f"Requirement references unknown teacher id={req['teacher_id']}.")
            if req["sessions_per_week"] < 1 or req["sessions_per_week"] > 15:
                errors.append(
                    f"sessions_per_week={req['sessions_per_week']} is out of range [1,15]."
                )

        # Total slots feasibility check
        # 5 days × 6 one-hour slots = 30 slots per division
        # Lab sessions consume 2 slots each; theory sessions consume 1 slot each.
        for div_id, div in self.divisions.items():
            div_reqs = [r for r in self.requirements if r["division_id"] == div_id]
            total_slots_needed = sum(
                r["sessions_per_week"] * (2 if self.subjects.get(r["subject_id"], {}).get("is_lab") else 1)
                for r in div_reqs
            )
            available_slots = 5 * 6  # 30
            if total_slots_needed > available_slots:
                errors.append(
                    f"Division {div['name']}: total slots required ({total_slots_needed}) "
                    f"exceeds available slots ({available_slots}). "
                    "Reduce sessions/week or convert some subjects to theory."
                )

        # Lab subject → lab room must exist
        lab_subjects = [s for s in self.subjects.values() if s.get("is_lab")]
        if lab_subjects:
            lab_rooms = [c for c in self.classrooms.values() if c.get("is_lab")]
            if not lab_rooms:
                errors.append(
                    "Lab subjects exist but no lab classrooms are defined."
                )

        return errors

    # ── Post-generation validation ──────────────────────────────────────────

    def validate_entries(self, entries, teacher_avail, classroom_avail):
        """
        entries: list of dicts {division_id, day, slot, subject_id, teacher_id, classroom_id}
        teacher_avail: {(teacher_id, day, slot): True/False}
        classroom_avail: {(classroom_id, day, slot): True/False}

        Returns list of conflict dicts.
        """
        conflicts = []

        # Build lookup sets
        teacher_slots = {}     # (teacher_id, day, slot) → division_id
        classroom_slots = {}   # (classroom_id, day, slot) → division_id
        division_slots = {}    # (division_id, day, slot) → subject_id
        sessions_count = {}    # (division_id, subject_id) → count

        for e in entries:
            tid = e["teacher_id"]
            cid = e["classroom_id"]
            did = e["division_id"]
            day = e["day"]
            slot = e["slot"]
            sid = e["subject_id"]

            tk = (tid, day, slot)
            ck = (cid, day, slot)
            dk = (did, day, slot)
            sk = (did, sid)

            # Hard constraint 1: teacher double-booking
            if tk in teacher_slots:
                conflicts.append({
                    "type": "teacher_conflict",
                    "severity": "hard",
                    "description": (
                        f"Teacher {self.teachers[tid]['name']} assigned to two divisions "
                        f"on day {day}, slot {slot}."
                    ),
                })
            else:
                teacher_slots[tk] = did

            # Hard constraint 2: classroom double-booking
            if ck in classroom_slots:
                conflicts.append({
                    "type": "classroom_conflict",
                    "severity": "hard",
                    "description": (
                        f"Classroom {self.classrooms[cid]['name']} used by two divisions "
                        f"on day {day}, slot {slot}."
                    ),
                })
            else:
                classroom_slots[ck] = did

            # Hard constraint 3: division double-booking
            if dk in division_slots:
                conflicts.append({
                    "type": "division_conflict",
                    "severity": "hard",
                    "description": (
                        f"Division {self.divisions[did]['name']} has two subjects "
                        f"on day {day}, slot {slot}."
                    ),
                })
            else:
                division_slots[dk] = sid

            # Hard constraint 5: teacher availability
            if not teacher_avail.get(tk, True):
                conflicts.append({
                    "type": "teacher_availability",
                    "severity": "hard",
                    "description": (
                        f"Teacher {self.teachers[tid]['name']} not available "
                        f"on day {day}, slot {slot}."
                    ),
                })

            # Hard constraint 6: classroom availability
            if not classroom_avail.get(ck, True):
                conflicts.append({
                    "type": "classroom_availability",
                    "severity": "hard",
                    "description": (
                        f"Classroom {self.classrooms[cid]['name']} not available "
                        f"on day {day}, slot {slot}."
                    ),
                })

            # Hard constraint 7: lab subjects in lab rooms
            subject = self.subjects.get(sid, {})
            classroom = self.classrooms.get(cid, {})
            if subject.get("is_lab") and not classroom.get("is_lab"):
                conflicts.append({
                    "type": "lab_room_required",
                    "severity": "hard",
                    "description": (
                        f"Subject {subject.get('name','?')} is a lab but assigned to "
                        f"non-lab room {classroom.get('name','?')}."
                    ),
                })

            sessions_count[sk] = sessions_count.get(sk, 0) + 1

        # Hard constraint 4: required sessions
        for req in self.requirements:
            sk = (req["division_id"], req["subject_id"])
            actual = sessions_count.get(sk, 0)
            required = req["sessions_per_week"]
            if actual != required:
                sub_name = self.subjects.get(req["subject_id"], {}).get("name", str(req["subject_id"]))
                div_name = self.divisions.get(req["division_id"], {}).get("name", str(req["division_id"]))
                conflicts.append({
                    "type": "session_count",
                    "severity": "hard",
                    "description": (
                        f"Division {div_name}: {sub_name} requires {required} sessions "
                        f"but got {actual}."
                    ),
                })

        return conflicts
