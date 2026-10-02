from utils.database import execute_query


def get_all_classes():
    return execute_query("SELECT * FROM classes ORDER BY name")


def get_class_by_id(class_id):
    rows = execute_query("SELECT * FROM classes WHERE id=%s", (class_id,))
    return rows[0] if rows else None


def create_class(name, year, department):
    result = execute_query(
        "INSERT INTO classes (name, year, department) VALUES (%s,%s,%s)",
        (name, year, department),
        fetch=False,
    )
    return get_class_by_id(result["lastrowid"])


def update_class(class_id, name, year, department):
    execute_query(
        "UPDATE classes SET name=%s, year=%s, department=%s WHERE id=%s",
        (name, year, department, class_id),
        fetch=False,
    )
    return get_class_by_id(class_id)


def delete_class(class_id):
    execute_query("DELETE FROM classes WHERE id=%s", (class_id,), fetch=False)


# ── Divisions ──────────────────────────────────

def get_divisions_by_class(class_id):
    return execute_query(
        "SELECT d.*, c.name AS class_name FROM divisions d "
        "JOIN classes c ON c.id=d.class_id WHERE d.class_id=%s ORDER BY d.name",
        (class_id,),
    )


def get_all_divisions():
    return execute_query(
        "SELECT d.*, c.name AS class_name FROM divisions d "
        "JOIN classes c ON c.id=d.class_id ORDER BY c.name, d.name"
    )


def get_division_by_id(division_id):
    rows = execute_query(
        "SELECT d.*, c.name AS class_name FROM divisions d "
        "JOIN classes c ON c.id=d.class_id WHERE d.id=%s",
        (division_id,),
    )
    return rows[0] if rows else None


def create_division(class_id, name, strength):
    result = execute_query(
        "INSERT INTO divisions (class_id, name, strength) VALUES (%s,%s,%s)",
        (class_id, name, strength),
        fetch=False,
    )
    return get_division_by_id(result["lastrowid"])


def delete_division(division_id):
    execute_query("DELETE FROM divisions WHERE id=%s", (division_id,), fetch=False)


# ── Subject Requirements ────────────────────────

def get_requirements(division_id):
    return execute_query(
        """
        SELECT sr.*, s.name AS subject_name, s.code, s.is_lab,
               t.name AS teacher_name
        FROM subject_requirements sr
        JOIN subjects  s ON s.id = sr.subject_id
        JOIN teachers  t ON t.id = sr.teacher_id
        WHERE sr.division_id = %s
        ORDER BY s.name
        """,
        (division_id,),
    )


def set_requirement(division_id, subject_id, teacher_id, sessions_per_week):
    execute_query(
        """
        INSERT INTO subject_requirements (division_id, subject_id, teacher_id, sessions_per_week)
        VALUES (%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE teacher_id=%s, sessions_per_week=%s
        """,
        (division_id, subject_id, teacher_id, sessions_per_week, teacher_id, sessions_per_week),
        fetch=False,
    )


def delete_requirement(division_id, subject_id):
    execute_query(
        "DELETE FROM subject_requirements WHERE division_id=%s AND subject_id=%s",
        (division_id, subject_id),
        fetch=False,
    )
