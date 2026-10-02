from flask import Blueprint, request, jsonify
import models.teacher as TeacherModel

teacher_bp = Blueprint("teachers", __name__)


@teacher_bp.route("/", methods=["GET"])
def get_teachers():
    return jsonify(TeacherModel.get_all()), 200


@teacher_bp.route("/<int:teacher_id>", methods=["GET"])
def get_teacher(teacher_id):
    t = TeacherModel.get_by_id(teacher_id)
    if not t:
        return jsonify({"error": "Teacher not found"}), 404
    return jsonify(t), 200


@teacher_bp.route("/", methods=["POST"])
def create_teacher():
    data = request.get_json()
    name       = (data.get("name") or "").strip()
    email      = (data.get("email") or "").strip() or None
    department = (data.get("department") or "").strip() or None
    max_hours  = int(data.get("max_hours", 20))

    if not name:
        return jsonify({"error": "name is required"}), 400

    t = TeacherModel.create(name, email, department, max_hours)
    return jsonify(t), 201


@teacher_bp.route("/<int:teacher_id>", methods=["PUT"])
def update_teacher(teacher_id):
    if not TeacherModel.get_by_id(teacher_id):
        return jsonify({"error": "Teacher not found"}), 404
    data = request.get_json()
    t = TeacherModel.update(
        teacher_id,
        (data.get("name") or "").strip(),
        (data.get("email") or "").strip() or None,
        (data.get("department") or "").strip() or None,
        int(data.get("max_hours", 20)),
    )
    return jsonify(t), 200


@teacher_bp.route("/<int:teacher_id>", methods=["DELETE"])
def delete_teacher(teacher_id):
    if not TeacherModel.get_by_id(teacher_id):
        return jsonify({"error": "Teacher not found"}), 404
    TeacherModel.delete(teacher_id)
    return jsonify({"message": "Teacher deleted"}), 200


@teacher_bp.route("/<int:teacher_id>/availability", methods=["GET"])
def get_availability(teacher_id):
    return jsonify(TeacherModel.get_availability(teacher_id)), 200


@teacher_bp.route("/<int:teacher_id>/availability", methods=["PUT"])
def set_availability(teacher_id):
    data = request.get_json()
    avail = data.get("availability", [])
    TeacherModel.set_availability(teacher_id, avail)
    return jsonify({"message": "Availability updated"}), 200
