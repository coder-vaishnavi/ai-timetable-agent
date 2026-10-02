from utils.database import execute_query


def get_all():
    return execute_query("SELECT * FROM classrooms ORDER BY name")


def get_by_id(classroom_id):
    rows = execute_query("SELECT * FROM classrooms WHERE id=%s", (classroom_id,))
    return rows[0] if rows else None


def create(name, capacity, is_lab):
    result = execute_query(
        "INSERT INTO classrooms (name, capacity, is_lab) VALUES (%s,%s,%s)",
        (name, capacity, int(is_lab)),
        fetch=False,
    )
    return get_by_id(result["lastrowid"])


def update(classroom_id, name, capacity, is_lab):
    execute_query(
        "UPDATE classrooms SET name=%s, capacity=%s, is_lab=%s WHERE id=%s",
        (name, capacity, int(is_lab), classroom_id),
        fetch=False,
    )
    return get_by_id(classroom_id)


def delete(classroom_id):
    execute_query("DELETE FROM classrooms WHERE id=%s", (classroom_id,), fetch=False)


def get_availability(classroom_id):
    return execute_query(
        "SELECT day, slot, available FROM classroom_availability WHERE classroom_id=%s ORDER BY day, slot",
        (classroom_id,),
    )


def set_availability(classroom_id, availability_list):
    execute_query(
        "DELETE FROM classroom_availability WHERE classroom_id=%s",
        (classroom_id,),
        fetch=False,
    )
    if availability_list:
        execute_query(
            "INSERT INTO classroom_availability (classroom_id,day,slot,available) VALUES (%s,%s,%s,%s)",
            [(classroom_id, a["day"], a["slot"], a["available"]) for a in availability_list],
            fetch=False,
            many=True,
        )
