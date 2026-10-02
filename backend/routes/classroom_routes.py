from flask import Blueprint, request, jsonify
import models.classroom as ClassroomModel

classroom_bp = Blueprint("classrooms", __name__)


@classroom_bp.route("/", methods=["GET"])
def get_classrooms():
    return jsonify(ClassroomModel.get_all()), 200


@classroom_bp.route("/<int:classroom_id>", methods=["GET"])
def get_classroom(classroom_id):
    c = ClassroomModel.get_by_id(classroom_id)
    if not c:
        return jsonify({"error": "Classroom not found"}), 404
    return jsonify(c), 200


@classroom_bp.route("/", methods=["POST"])
def create_classroom():
    data = request.get_json()
    name     = (data.get("name") or "").strip()
    capacity = int(data.get("capacity", 60))
    is_lab   = bool(data.get("is_lab", False))
    if not name:
        return jsonify({"error": "name is required"}), 400
    c = ClassroomModel.create(name, capacity, is_lab)
    return jsonify(c), 201


@classroom_bp.route("/<int:classroom_id>", methods=["PUT"])
def update_classroom(classroom_id):
    if not ClassroomModel.get_by_id(classroom_id):
        return jsonify({"error": "Classroom not found"}), 404
    data = request.get_json()
    c = ClassroomModel.update(
        classroom_id,
        (data.get("name") or "").strip(),
        int(data.get("capacity", 60)),
        bool(data.get("is_lab", False)),
    )
    return jsonify(c), 200


@classroom_bp.route("/<int:classroom_id>", methods=["DELETE"])
def delete_classroom(classroom_id):
    if not ClassroomModel.get_by_id(classroom_id):
        return jsonify({"error": "Classroom not found"}), 404
    ClassroomModel.delete(classroom_id)
    return jsonify({"message": "Classroom deleted"}), 200


@classroom_bp.route("/<int:classroom_id>/availability", methods=["GET"])
def get_availability(classroom_id):
    return jsonify(ClassroomModel.get_availability(classroom_id)), 200


@classroom_bp.route("/<int:classroom_id>/availability", methods=["PUT"])
def set_availability(classroom_id):
    data = request.get_json()
    avail = data.get("availability", [])
    ClassroomModel.set_availability(classroom_id, avail)
    return jsonify({"message": "Availability updated"}), 200
