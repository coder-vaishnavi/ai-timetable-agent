"""
Natural-language constraint parser for the AI Timetable Agent.
No paid APIs – uses regex / keyword matching only.
"""
import re


# ── Keyword banks ───────────────────────────────────────────────────────────

DAY_ALIASES = {
    "monday": 0,    "mon": 0,
    "tuesday": 1,   "tue": 1, "tues": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3,  "thu": 3, "thur": 3, "thurs": 3,
    "friday": 4,    "fri": 4,
}

SLOT_ALIASES = {
    "first": 0,  "1st": 0, "morning": 0,  "10": 0, "10am": 0,
    "second": 1, "2nd": 1, "afternoon": 1, "12": 1, "12pm": 1, "noon": 1,
    "third": 2,  "3rd": 2, "evening": 2,  "2": 2,  "2pm": 2,  "late": 2,
}

INTENT_PATTERNS = [
    # Unavailability
    (re.compile(r"not\s+(?:available|free|present|teaching)\s+on\s+(\w+)", re.I), "unavailable_day"),
    (re.compile(r"unavailable\s+on\s+(\w+)", re.I), "unavailable_day"),
    (re.compile(r"(?:off|leave)\s+on\s+(\w+)", re.I), "unavailable_day"),
    # Prefer slot
    (re.compile(r"prefer\s+(?:the\s+)?(\w+)\s+slot", re.I), "prefer_slot"),
    (re.compile(r"prefer\s+(?:to\s+teach\s+)?(?:in\s+the\s+)?(\w+)", re.I), "prefer_time"),
    # Consecutive sessions
    (re.compile(r"consecutive\s+sessions?\s+for\s+([\w\s]+)", re.I), "consecutive"),
    (re.compile(r"([\w\s]+)\s+back.to.back", re.I), "consecutive"),
    # Sessions per week
    (re.compile(r"(\w+)\s+(?:should\s+have|needs?|requires?)\s+(\d+)\s+sessions?(?:\s+per\s+week)?", re.I), "sessions_count"),
    (re.compile(r"(\d+)\s+sessions?\s+(?:per\s+week\s+)?(?:of|for)\s+([\w\s]+)", re.I), "sessions_count_rev"),
    # Free day
    (re.compile(r"(?:keep|make|have)\s+(\w+)\s+free", re.I), "free_day"),
    (re.compile(r"no\s+classes?\s+on\s+(\w+)", re.I), "free_day"),
    # Classroom preference
    (re.compile(r"(?:use|assign|book)\s+([\w\s]+(?:lab|room)[\w\s]*)\s+for\s+([\w\s]+)", re.I), "room_assign"),
]


class ConstraintParser:
    """Parse free-text input into a list of structured constraint dicts."""

    def parse(self, text: str) -> dict:
        """
        Returns:
        {
          "parsed_constraints": [...],
          "warnings": [...],
          "original_text": "..."
        }
        Each constraint: {"type":…, "params":{…}, "source_text":…}
        """
        text = text.strip()
        sentences = re.split(r"[.;,\n]+", text)
        parsed = []
        warnings = []

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            result = self._parse_sentence(sentence)
            if result:
                parsed.append(result)
            else:
                warnings.append(f"Could not parse: \"{sentence}\"")

        return {
            "parsed_constraints": parsed,
            "warnings": warnings,
            "original_text": text,
        }

    def _parse_sentence(self, sentence: str):
        for pattern, intent in INTENT_PATTERNS:
            m = pattern.search(sentence)
            if m:
                return self._build_constraint(intent, m, sentence)
        return None

    def _build_constraint(self, intent, match, sentence):
        if intent == "unavailable_day":
            day_word = match.group(1).lower()
            day_idx  = DAY_ALIASES.get(day_word)
            return {
                "type": "teacher_unavailable_day",
                "params": {"day": day_idx, "day_name": day_word},
                "source_text": sentence,
                "resolved": day_idx is not None,
            }

        if intent in ("prefer_slot", "prefer_time"):
            slot_word = match.group(1).lower()
            slot_idx  = SLOT_ALIASES.get(slot_word)
            return {
                "type": "prefer_slot",
                "params": {"slot": slot_idx, "slot_name": slot_word},
                "source_text": sentence,
                "resolved": slot_idx is not None,
            }

        if intent == "consecutive":
            subject = match.group(1).strip()
            return {
                "type": "consecutive_sessions",
                "params": {"subject_name": subject},
                "source_text": sentence,
                "resolved": True,
            }

        if intent == "sessions_count":
            subject  = match.group(1).strip()
            sessions = int(match.group(2))
            return {
                "type": "sessions_per_week",
                "params": {"subject_name": subject, "sessions": sessions},
                "source_text": sentence,
                "resolved": True,
            }

        if intent == "sessions_count_rev":
            sessions = int(match.group(1))
            subject  = match.group(2).strip()
            return {
                "type": "sessions_per_week",
                "params": {"subject_name": subject, "sessions": sessions},
                "source_text": sentence,
                "resolved": True,
            }

        if intent == "free_day":
            day_word = match.group(1).lower()
            day_idx  = DAY_ALIASES.get(day_word)
            return {
                "type": "free_day",
                "params": {"day": day_idx, "day_name": day_word},
                "source_text": sentence,
                "resolved": day_idx is not None,
            }

        if intent == "room_assign":
            room    = match.group(1).strip()
            subject = match.group(2).strip()
            return {
                "type": "room_assignment",
                "params": {"room_name": room, "subject_name": subject},
                "source_text": sentence,
                "resolved": True,
            }

        return None

    def summarize(self, parsed_result: dict) -> str:
        """Return a human-readable summary of parsed constraints."""
        constraints = parsed_result.get("parsed_constraints", [])
        if not constraints:
            return "No constraints were identified."
        lines = [f"Identified {len(constraints)} constraint(s):"]
        for c in constraints:
            ctype  = c["type"].replace("_", " ").title()
            params = ", ".join(f"{k}={v}" for k, v in c["params"].items())
            lines.append(f"  • [{ctype}] {params}")
        return "\n".join(lines)
