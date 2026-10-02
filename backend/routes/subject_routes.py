from flask import Blueprint, request, jsonify
import models.subject as SubjectModel

subject_bp = Blueprint("subjects", __name__)


@subject_bp.route("/", methods=["GET"])
def get_subjects():
    return jsonify(SubjectModel.get_all()), 200


@subject_bp.route("/<int:subject_id>", methods=["GET"])
def get_subject(subject_id):
    s = SubjectModel.get_by_id(subject_id)
    if not s:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify(s), 200


@subject_bp.route("/", methods=["POST"])
def create_subject():
    data = request.get_json()
    name    = (data.get("name") or "").strip()
    code    = (data.get("code") or "").strip()
    is_lab  = bool(data.get("is_lab", False))
    spw     = int(data.get("sessions_per_week", 3))
    if not name or not code:
        return jsonify({"error": "name and code are required"}), 400
    s = SubjectModel.create(name, code, is_lab, spw)
    return jsonify(s), 201


@subject_bp.route("/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id):
    if not SubjectModel.get_by_id(subject_id):
        return jsonify({"error": "Subject not found"}), 404
    data = request.get_json()
    s = SubjectModel.update(
        subject_id,
        (data.get("name") or "").strip(),
        (data.get("code") or "").strip(),
        bool(data.get("is_lab", False)),
        int(data.get("sessions_per_week", 3)),
    )
    return jsonify(s), 200


@subject_bp.route("/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    if not SubjectModel.get_by_id(subject_id):
        return jsonify({"error": "Subject not found"}), 404
    SubjectModel.delete(subject_id)
    return jsonify({"message": "Subject deleted"}), 200
