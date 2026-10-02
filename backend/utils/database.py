import mysql.connector
from mysql.connector import pooling
from config import config


_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="timetable_pool",
            pool_size=5,
            host=config.DB_HOST,
            port=config.DB_PORT,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME,
            charset="utf8mb4",
            autocommit=False,
        )
    return _pool


def get_connection():
    return get_pool().get_connection()


def execute_query(sql, params=None, fetch=True, many=False):
    """
    Execute a SQL statement.

    fetch=True  → returns list of dicts (SELECT)
    fetch=False → returns lastrowid / rowcount (INSERT/UPDATE/DELETE)
    many=True   → executemany with params as list-of-tuples
    """
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        if many:
            cursor.executemany(sql, params or [])
        else:
            cursor.execute(sql, params or ())
        if fetch:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = {"lastrowid": cursor.lastrowid, "rowcount": cursor.rowcount}
        return result
    except Exception as exc:
        conn.rollback()
        raise exc
    finally:
        cursor.close()
        conn.close()


def execute_transaction(operations):
    """
    Execute a list of (sql, params) tuples in a single transaction.
    Returns list of lastrowids.
    """
    conn = get_connection()
    lastrowids = []
    try:
        cursor = conn.cursor(dictionary=True)
        for sql, params in operations:
            cursor.execute(sql, params or ())
            lastrowids.append(cursor.lastrowid)
        conn.commit()
        return lastrowids
    except Exception as exc:
        conn.rollback()
        raise exc
    finally:
        cursor.close()
        conn.close()
