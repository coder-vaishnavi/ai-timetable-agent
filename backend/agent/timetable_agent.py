"""
AI Timetable Agent – single-level orchestrator.

Workflow:
  1. Receive input
  2. Parse natural-language modifications (if any)
  3. Validate hard constraints
  4. Load availability maps
  5. Run OR-Tools CP-SAT optimizer
  6. Validate generated entries
  7. Regenerate once if soft violations found
  8. Return structured response
"""
from config import config
from agent.optimizer import TimetableOptimizer
from agent.validator import ConstraintValidator
from agent.constraint_parser import ConstraintParser


DAYS   = config.DAYS
SLOTS  = config.SLOTS


class TimetableAgent:
    """Single AI agent that orchestrates the full timetable generation pipeline."""

    def __init__(self, teachers, subjects, classrooms, divisions,
                 requirements, teacher_avail_rows, classroom_avail_rows):
        """
        teachers / subjects / classrooms / divisions: lists of model dicts
        requirements      : list of subject_requirements dicts
        teacher_avail_rows: rows from teacher_availability table
        classroom_avail_rows: rows from classroom_availability table
        """
        self.teachers   = teachers
        self.subjects   = subjects
        self.classrooms = classrooms
        self.divisions  = divisions
        self.requirements = requirements

        # Build availability dicts  {(id, day, slot): bool}
        self.teacher_avail = {
            (r["teacher_id"], r["day"], r["slot"]): bool(r["available"])
            for r in teacher_avail_rows
        }
        self.classroom_avail = {
            (r["classroom_id"], r["day"], r["slot"]): bool(r["available"])
            for r in classroom_avail_rows
        }

        self.parser    = ConstraintParser()
        self.validator = ConstraintValidator(
            teachers, subjects, classrooms, divisions, requirements
        )
        self.steps = []

    # ── Public API ──────────────────────────────────────────────────────────

    def generate(self, nl_input: str = "", time_limit: int = 60) -> dict:
        """
        Main entry-point.  Returns the standard agent response dict.
        """
        self.steps = []
        self.nl_constraints = {}

        try:
            # Step 1 – Input analysis
            self._step("Input Analysis",
                       f"Received {len(self.requirements)} subject requirements across "
                       f"{len(self.divisions)} divisions and {len(self.teachers)} teachers.")

            # Step 2 – Natural-language parsing
            if nl_input.strip():
                self.nl_constraints = self.parser.parse(nl_input)
                self._apply_nl_constraints()
                self._step("Natural Language Parsing",
                           self.parser.summarize(self.nl_constraints))
            else:
                self._step("Natural Language Parsing", "No NL input provided – skipped.")

            # Step 3 – Validate inputs
            errors = self.validator.validate_inputs()
            if errors:
                self._step("Constraint Validation", "; ".join(errors), status="error")
                return self._error_response("Input validation failed: " + "; ".join(errors))
            self._step("Constraint Validation",
                       "All hard input constraints satisfied.")

            # Step 4 – Availability checks
            total_teacher_avail = sum(1 for v in self.teacher_avail.values() if v)
            total_cr_avail      = sum(1 for v in self.classroom_avail.values() if v)
            self._step("Teacher Availability Check",
                       f"{len(self.teachers)} teachers checked, "
                       f"{total_teacher_avail} available slots total.")
            self._step("Classroom Availability Check",
                       f"{len(self.classrooms)} classrooms checked, "
                       f"{total_cr_avail} available slots total.")

            # Step 5 – Division constraints summary
            for div in self.divisions:
                div_reqs = [r for r in self.requirements if r["division_id"] == div["id"]]
                total    = sum(r["sessions_per_week"] for r in div_reqs)
                self._step(f"Division {div['name']} Constraints",
                           f"{len(div_reqs)} subjects, {total} sessions/week required.")

            # Step 6 – Optimization
            self._step("CP-SAT Optimization", "Starting OR-Tools CP-SAT solver…")
            optimizer = TimetableOptimizer(
                self.teachers, self.subjects, self.classrooms,
                self.divisions, self.requirements,
                self.teacher_avail, self.classroom_avail,
            )
            entries, score = optimizer.solve(time_limit_seconds=time_limit)
            self._step("CP-SAT Optimization",
                       f"Solver completed. {len(entries)} assignments made. "
                       f"Raw score: {score}.")

            # Step 7 – Conflict check
            conflicts = self.validator.validate_entries(
                entries, self.teacher_avail, self.classroom_avail
            )
            hard_conflicts = [c for c in conflicts if c["severity"] == "hard"]

            if hard_conflicts:
                self._step("Conflict Check",
                           f"{len(hard_conflicts)} hard conflicts detected. Attempting re-solve…",
                           status="warning")
                # Single retry with a longer time limit
                entries, score = optimizer.solve(time_limit_seconds=time_limit * 2)
                conflicts = self.validator.validate_entries(
                    entries, self.teacher_avail, self.classroom_avail
                )
                hard_conflicts = [c for c in conflicts if c["severity"] == "hard"]

            if hard_conflicts:
                self._step("Conflict Check",
                           f"{len(hard_conflicts)} hard conflicts remain after retry.",
                           status="warning")
            else:
                self._step("Conflict Check", "No hard conflicts in generated timetable.")

            # Step 8 – Build structured result
            self._step("Timetable Generation", "Formatting final timetable structure.")
            divisions_output = self._format_output(entries)

            return {
                "status": "success",
                "message": "Timetable generated successfully",
                "optimization_score": score,
                "conflicts": conflicts,
                "agent_steps": self.steps,
                "divisions": divisions_output,
                "raw_entries": entries,
            }

        except RuntimeError as exc:
            self._step("Error", str(exc), status="error")
            return self._error_response(str(exc))
        except Exception as exc:
            self._step("Unexpected Error", str(exc), status="error")
            return self._error_response(f"Unexpected error: {exc}")

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _step(self, name, message, status="success"):
        self.steps.append({"step": name, "message": message, "status": status})

    def _error_response(self, message):
        return {
            "status": "error",
            "message": message,
            "optimization_score": 0,
            "conflicts": [],
            "agent_steps": self.steps,
            "divisions": [],
            "raw_entries": [],
        }

    def _apply_nl_constraints(self):
        """Apply parsed NL constraints by modifying availability maps."""
        for c in self.nl_constraints.get("parsed_constraints", []):
            ctype  = c["type"]
            params = c["params"]

            if ctype == "teacher_unavailable_day" and params.get("day") is not None:
                day = params["day"]
                for t in self.teachers:
                    for slot in range(3):
                        self.teacher_avail[(t["id"], day, slot)] = False

            elif ctype == "free_day" and params.get("day") is not None:
                day = params["day"]
                for div in self.divisions:
                    for slot in range(3):
                        # Mark all teachers unavailable that day
                        for t in self.teachers:
                            self.teacher_avail[(t["id"], day, slot)] = False

            elif ctype == "sessions_per_week":
                sub_name = params.get("subject_name", "").lower()
                sessions = params.get("sessions", 3)
                for req in self.requirements:
                    sid = req["subject_id"]
                    sub = next((s for s in self.subjects if s["id"] == sid), None)
                    if sub and sub_name in sub["name"].lower():
                        req["sessions_per_week"] = max(1, min(sessions, 15))

    def _format_output(self, entries):
        """
        Group entries by division and format into the standard API output.
        """
        subject_map  = {s["id"]: s for s in self.subjects}
        teacher_map  = {t["id"]: t for t in self.teachers}
        classroom_map = {c["id"]: c for c in self.classrooms}
        division_map = {d["id"]: d for d in self.divisions}

        # Group by division
        div_entries = {}
        for e in entries:
            did = e["division_id"]
            div_entries.setdefault(did, []).append(e)

        result = []
        for div_id, div_ents in sorted(div_entries.items()):
            timetable_rows = []
            for e in sorted(div_ents, key=lambda x: (x["day"], x["slot"])):
                day_name = DAYS[e["day"]]
                slot_info = SLOTS[e["slot"]]
                sub  = subject_map.get(e["subject_id"], {})
                tea  = teacher_map.get(e["teacher_id"], {})
                cr   = classroom_map.get(e["classroom_id"], {})
                timetable_rows.append({
                    "day":        day_name,
                    "day_index":  e["day"],
                    "slot":       e["slot"],
                    "time_slot":  slot_info["label"],
                    "subject":    sub.get("name", ""),
                    "subject_code": sub.get("code", ""),
                    "is_lab":     bool(sub.get("is_lab")),
                    "teacher":    tea.get("name", ""),
                    "classroom":  cr.get("name", ""),
                })

            div_info = division_map.get(div_id, {})
            result.append({
                "division_id":   div_id,
                "division_name": div_info.get("name", ""),
                "timetable":     timetable_rows,
            })
        return result

    # ── Analysis-only (no generation) ──────────────────────────────────────

    def analyze(self, nl_input: str) -> dict:
        """Parse NL input and return constraint analysis without generating."""
        parsed = self.parser.parse(nl_input)
        summary = self.parser.summarize(parsed)
        return {
            "status": "success",
            "parsed_constraints": parsed["parsed_constraints"],
            "warnings": parsed["warnings"],
            "summary": summary,
        }
