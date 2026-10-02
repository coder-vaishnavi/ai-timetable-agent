from flask import Blueprint, request, jsonify
import models.division as DivisionModel

division_bp = Blueprint("divisions", __name__)


# ── Classes ──────────────────────────────────────────────────────────────────

@division_bp.route("/classes", methods=["GET"])
def get_classes():
    return jsonify(DivisionModel.get_all_classes()), 200


@division_bp.route("/classes/<int:class_id>", methods=["GET"])
def get_class(class_id):
    c = DivisionModel.get_class_by_id(class_id)
    if not c:
        return jsonify({"error": "Class not found"}), 404
    return jsonify(c), 200


@division_bp.route("/classes", methods=["POST"])
def create_class():
    data  = request.get_json()
    name  = (data.get("name") or "").strip()
    year  = (data.get("year") or "").strip() or None
    dept  = (data.get("department") or "").strip() or None
    if not name:
        return jsonify({"error": "name is required"}), 400
    c = DivisionModel.create_class(name, year, dept)
    return jsonify(c), 201


@division_bp.route("/classes/<int:class_id>", methods=["PUT"])
def update_class(class_id):
    if not DivisionModel.get_class_by_id(class_id):
        return jsonify({"error": "Class not found"}), 404
    data = request.get_json()
    c = DivisionModel.update_class(
        class_id,
        (data.get("name") or "").strip(),
        (data.get("year") or "").strip() or None,
        (data.get("department") or "").strip() or None,
    )
    return jsonify(c), 200


@division_bp.route("/classes/<int:class_id>", methods=["DELETE"])
def delete_class(class_id):
    if not DivisionModel.get_class_by_id(class_id):
        return jsonify({"error": "Class not found"}), 404
    DivisionModel.delete_class(class_id)
    return jsonify({"message": "Class deleted"}), 200


# ── Divisions ─────────────────────────────────────────────────────────────────

@division_bp.route("/", methods=["GET"])
def get_all_divisions():
    class_id = request.args.get("class_id")
    if class_id:
        return jsonify(DivisionModel.get_divisions_by_class(int(class_id))), 200
    return jsonify(DivisionModel.get_all_divisions()), 200


@division_bp.route("/<int:division_id>", methods=["GET"])
def get_division(division_id):
    d = DivisionModel.get_division_by_id(division_id)
    if not d:
        return jsonify({"error": "Division not found"}), 404
    return jsonify(d), 200


@division_bp.route("/", methods=["POST"])
def create_division():
    data     = request.get_json()
    class_id = data.get("class_id")
    name     = (data.get("name") or "").strip()
    strength = int(data.get("strength", 60))
    if not class_id or not name:
        return jsonify({"error": "class_id and name are required"}), 400
    d = DivisionModel.create_division(class_id, name, strength)
    return jsonify(d), 201


@division_bp.route("/<int:division_id>", methods=["DELETE"])
def delete_division(division_id):
    if not DivisionModel.get_division_by_id(division_id):
        return jsonify({"error": "Division not found"}), 404
    DivisionModel.delete_division(division_id)
    return jsonify({"message": "Division deleted"}), 200


# ── Subject Requirements ──────────────────────────────────────────────────────

@division_bp.route("/<int:division_id>/requirements", methods=["GET"])
def get_requirements(division_id):
    return jsonify(DivisionModel.get_requirements(division_id)), 200


@division_bp.route("/<int:division_id>/requirements", methods=["POST"])
def set_requirement(division_id):
    data           = request.get_json()
    subject_id     = data.get("subject_id")
    teacher_id     = data.get("teacher_id")
    sessions       = int(data.get("sessions_per_week", 3))
    if not subject_id or not teacher_id:
        return jsonify({"error": "subject_id and teacher_id are required"}), 400
    DivisionModel.set_requirement(division_id, subject_id, teacher_id, sessions)
    return jsonify({"message": "Requirement saved"}), 200


@division_bp.route("/<int:division_id>/requirements/<int:subject_id>", methods=["DELETE"])
def delete_requirement(division_id, subject_id):
    DivisionModel.delete_requirement(division_id, subject_id)
    return jsonify({"message": "Requirement deleted"}), 200
