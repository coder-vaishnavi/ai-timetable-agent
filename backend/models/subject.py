from utils.database import execute_query


def get_all():
    return execute_query("SELECT * FROM subjects ORDER BY name")


def get_by_id(subject_id):
    rows = execute_query("SELECT * FROM subjects WHERE id=%s", (subject_id,))
    return rows[0] if rows else None


def create(name, code, is_lab, sessions_per_week):
    result = execute_query(
        "INSERT INTO subjects (name, code, is_lab, sessions_per_week) VALUES (%s,%s,%s,%s)",
        (name, code, int(is_lab), sessions_per_week),
        fetch=False,
    )
    return get_by_id(result["lastrowid"])


def update(subject_id, name, code, is_lab, sessions_per_week):
    execute_query(
        "UPDATE subjects SET name=%s, code=%s, is_lab=%s, sessions_per_week=%s WHERE id=%s",
        (name, code, int(is_lab), sessions_per_week, subject_id),
        fetch=False,
    )
    return get_by_id(subject_id)


def delete(subject_id):
    execute_query("DELETE FROM subjects WHERE id=%s", (subject_id,), fetch=False)
