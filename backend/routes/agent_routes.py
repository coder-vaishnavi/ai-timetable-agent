from flask import Blueprint, request, jsonify
from utils.database import execute_query
import models.timetable as TimetableModel
import models.teacher as TeacherModel
import models.subject as SubjectModel
import models.classroom as ClassroomModel
import models.division as DivisionModel
from agent.timetable_agent import TimetableAgent

agent_bp = Blueprint("agent", __name__)


def _load_agent_data(class_id, division_ids=None):
    """Load all data needed to build the agent."""
    teachers   = TeacherModel.get_all()
    subjects   = SubjectModel.get_all()
    classrooms = ClassroomModel.get_all()

    if division_ids:
        divisions = [DivisionModel.get_division_by_id(d) for d in division_ids]
        divisions = [d for d in divisions if d]
    else:
        divisions = DivisionModel.get_divisions_by_class(class_id)

    requirements = []
    for div in divisions:
        reqs = DivisionModel.get_requirements(div["id"])
        requirements.extend(reqs)

    # Load availability
    teacher_avail_rows = execute_query(
        "SELECT teacher_id, day, slot, available FROM teacher_availability"
    )
    classroom_avail_rows = execute_query(
        "SELECT classroom_id, day, slot, available FROM classroom_availability"
    )

    return teachers, subjects, classrooms, divisions, requirements, teacher_avail_rows, classroom_avail_rows


@agent_bp.route("/analyze", methods=["POST"])
def analyze():
    """Parse natural-language input without generating a timetable."""
    data     = request.get_json()
    nl_input = (data.get("nl_input") or "").strip()
    if not nl_input:
        return jsonify({"error": "nl_input is required"}), 400

    class_id = data.get("class_id", 1)
    try:
        teachers, subjects, classrooms, divisions, requirements, ta, ca = _load_agent_data(class_id)
        agent = TimetableAgent(teachers, subjects, classrooms, divisions,
                               requirements, ta, ca)
        result = agent.analyze(nl_input)
        return jsonify(result), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@agent_bp.route("/generate", methods=["POST"])
def generate():
    """Run the full AI agent pipeline and save the resulting timetable."""
    data         = request.get_json()
    class_id     = data.get("class_id")
    division_ids = data.get("division_ids")  # optional list
    nl_input     = (data.get("nl_input") or "").strip()
    name         = (data.get("name") or "").strip() or "AI Generated Timetable"
    time_limit   = int(data.get("time_limit", 60))

    if not class_id:
        return jsonify({"error": "class_id is required"}), 400

    user_id = None

    try:
        teachers, subjects, classrooms, divisions, requirements, ta, ca = \
            _load_agent_data(class_id, division_ids)

        if not divisions:
            return jsonify({"error": "No divisions found for the given class"}), 400
        if not requirements:
            return jsonify({"error": "No subject requirements found. Please configure requirements first."}), 400

        agent = TimetableAgent(teachers, subjects, classrooms, divisions,
                               requirements, ta, ca)
        result = agent.generate(nl_input=nl_input, time_limit=time_limit)

        if result["status"] == "error":
            return jsonify(result), 200

        # Save to DB
        timetable_id = TimetableModel.create(
            name=name,
            class_id=class_id,
            optimization_score=result["optimization_score"],
            conflicts_count=len(result["conflicts"]),
            user_id=user_id,
            entries=result["raw_entries"],
        )

        # Log agent steps
        for step in result["agent_steps"]:
            TimetableModel.log_step(
                timetable_id,
                step["step"],
                step["status"],
                step["message"],
            )

        result["timetable_id"] = timetable_id
        # Remove raw_entries from response (large payload not needed by frontend)
        result.pop("raw_entries", None)
        return jsonify(result), 200

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
