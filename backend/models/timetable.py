from utils.database import execute_query


def get_all(user_id=None):
    if user_id:
        return execute_query(
            "SELECT t.*, c.name AS class_name FROM timetable t "
            "JOIN classes c ON c.id=t.class_id WHERE t.created_by=%s ORDER BY t.created_at DESC",
            (user_id,),
        )
    return execute_query(
        "SELECT t.*, c.name AS class_name FROM timetable t "
        "JOIN classes c ON c.id=t.class_id ORDER BY t.created_at DESC"
    )


def get_by_id(timetable_id):
    rows = execute_query(
        "SELECT t.*, c.name AS class_name FROM timetable t "
        "JOIN classes c ON c.id=t.class_id WHERE t.id=%s",
        (timetable_id,),
    )
    return rows[0] if rows else None


def get_entries(timetable_id):
    return execute_query(
        """
        SELECT te.*,
               d.name  AS division_name,
               s.name  AS subject_name, s.code AS subject_code, s.is_lab,
               t.name  AS teacher_name,
               cr.name AS classroom_name
        FROM timetable_entries te
        JOIN divisions  d  ON d.id  = te.division_id
        JOIN subjects   s  ON s.id  = te.subject_id
        JOIN teachers   t  ON t.id  = te.teacher_id
        JOIN classrooms cr ON cr.id = te.classroom_id
        WHERE te.timetable_id = %s
        ORDER BY te.division_id, te.day, te.slot
        """,
        (timetable_id,),
    )


def create(name, class_id, optimization_score, conflicts_count, user_id, entries):
    """
    entries: list of dicts with keys division_id,day,slot,subject_id,teacher_id,classroom_id
    Returns timetable_id.
    """
    ops = []
    ops.append((
        "INSERT INTO timetable (name,class_id,status,optimization_score,conflicts_count,created_by) "
        "VALUES (%s,%s,'generated',%s,%s,%s)",
        (name, class_id, optimization_score, conflicts_count, user_id),
    ))
    # We need the new ID — do header insert separately, then batch entries
    conn_result = execute_query(
        "INSERT INTO timetable (name,class_id,status,optimization_score,conflicts_count,created_by) "
        "VALUES (%s,%s,'generated',%s,%s,%s)",
        (name, class_id, optimization_score, conflicts_count, user_id),
        fetch=False,
    )
    timetable_id = conn_result["lastrowid"]

    if entries:
        execute_query(
            "INSERT INTO timetable_entries "
            "(timetable_id,division_id,day,slot,subject_id,teacher_id,classroom_id) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s)",
            [
                (timetable_id, e["division_id"], e["day"], e["slot"],
                 e["subject_id"], e["teacher_id"], e["classroom_id"])
                for e in entries
            ],
            fetch=False,
            many=True,
        )
    return timetable_id


def update_status(timetable_id, status):
    execute_query(
        "UPDATE timetable SET status=%s WHERE id=%s",
        (status, timetable_id),
        fetch=False,
    )


def delete(timetable_id):
    execute_query("DELETE FROM timetable WHERE id=%s", (timetable_id,), fetch=False)


def log_step(timetable_id, step_name, status, message):
    execute_query(
        "INSERT INTO generation_logs (timetable_id,step_name,status,message) VALUES (%s,%s,%s,%s)",
        (timetable_id, step_name, status, message),
        fetch=False,
    )


def get_stats():
    rows = execute_query(
        """
        SELECT
            (SELECT COUNT(*) FROM timetable)                       AS total_timetables,
            (SELECT COUNT(*) FROM teachers)                        AS total_teachers,
            (SELECT COUNT(*) FROM subjects)                        AS total_subjects,
            (SELECT COUNT(*) FROM classrooms)                      AS total_classrooms,
            (SELECT COUNT(*) FROM divisions)                       AS total_divisions,
            (SELECT COALESCE(AVG(optimization_score),0) FROM timetable WHERE status!='archived') AS avg_score
        """
    )
    return rows[0] if rows else {}
