from flask import Flask, jsonify
from flask_cors import CORS
from config import config

from routes.auth_routes      import auth_bp
from routes.teacher_routes   import teacher_bp
from routes.subject_routes   import subject_bp
from routes.classroom_routes import classroom_bp
from routes.division_routes  import division_bp
from routes.timetable_routes import timetable_bp
from routes.agent_routes     import agent_bp


def create_app():
    app = Flask(__name__)

    # ── Extensions ───────────────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}},
         supports_credentials=True)

    # ── Blueprints ───────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp,       url_prefix="/api/auth")
    app.register_blueprint(teacher_bp,    url_prefix="/api/teachers")
    app.register_blueprint(subject_bp,    url_prefix="/api/subjects")
    app.register_blueprint(classroom_bp,  url_prefix="/api/classrooms")
    app.register_blueprint(division_bp,   url_prefix="/api/divisions")
    app.register_blueprint(timetable_bp,  url_prefix="/api/timetables")
    app.register_blueprint(agent_bp,      url_prefix="/api/agent")

    # ── Health check ─────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "AI Timetable Agent"}), 200

    # ── Global error handlers ────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
