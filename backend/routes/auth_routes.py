import bcrypt
from flask import Blueprint, request, jsonify
from utils.database import execute_query

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    email    = (data.get("email")    or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    existing = execute_query(
        "SELECT id FROM users WHERE username=%s OR email=%s", (username, email)
    )
    if existing:
        return jsonify({"error": "Username or email already taken"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    result = execute_query(
        "INSERT INTO users (username, email, password) VALUES (%s,%s,%s)",
        (username, email, hashed),
        fetch=False,
    )
    return jsonify({"id": result["lastrowid"], "username": username}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    rows = execute_query(
        "SELECT id, username, email, password, role FROM users WHERE username=%s",
        (username,),
    )
    if not rows:
        return jsonify({"error": "Invalid credentials"}), 401

    user = rows[0]
    if not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "user": {
            "id":       user["id"],
            "username": user["username"],
            "email":    user["email"],
            "role":     user["role"],
        },
    }), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter is required"}), 400
    rows = execute_query(
        "SELECT id, username, email, role FROM users WHERE id=%s", (user_id,)
    )
    if not rows:
        return jsonify({"error": "User not found"}), 404
    return jsonify(rows[0]), 200
