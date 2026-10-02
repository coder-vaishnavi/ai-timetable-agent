from utils.database import execute_query


def get_all():
    return execute_query("SELECT * FROM teachers ORDER BY name")


def get_by_id(teacher_id):
    rows = execute_query("SELECT * FROM teachers WHERE id = %s", (teacher_id,))
    return rows[0] if rows else None


def create(name, email, department, max_hours):
    result = execute_query(
        "INSERT INTO teachers (name, email, department, max_hours) VALUES (%s,%s,%s,%s)",
        (name, email, department, max_hours),
        fetch=False,
    )
    return get_by_id(result["lastrowid"])


def update(teacher_id, name, email, department, max_hours):
    execute_query(
        "UPDATE teachers SET name=%s, email=%s, department=%s, max_hours=%s WHERE id=%s",
        (name, email, department, max_hours, teacher_id),
        fetch=False,
    )
    return get_by_id(teacher_id)


def delete(teacher_id):
    execute_query("DELETE FROM teachers WHERE id=%s", (teacher_id,), fetch=False)


def get_availability(teacher_id):
    return execute_query(
        "SELECT day, slot, available FROM teacher_availability WHERE teacher_id=%s ORDER BY day, slot",
        (teacher_id,),
    )


def set_availability(teacher_id, availability_list):
    """
    availability_list: [{"day":0,"slot":0,"available":1}, ...]
    """
    execute_query(
        "DELETE FROM teacher_availability WHERE teacher_id=%s",
        (teacher_id,),
        fetch=False,
    )
    if availability_list:
        execute_query(
            "INSERT INTO teacher_availability (teacher_id,day,slot,available) VALUES (%s,%s,%s,%s)",
            [(teacher_id, a["day"], a["slot"], a["available"]) for a in availability_list],
            fetch=False,
            many=True,
        )
