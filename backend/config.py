import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Database
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = int(os.environ.get("DB_PORT", 3306))
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_NAME = os.environ.get("DB_NAME", "ai_timetable_agent")

    # CORS
    CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Schedule constants
    # Slots are 1-hour theory units.  Labs always occupy 2 consecutive slots.
    # LAB_STARTS = even slot indices (0, 2, 4) → maps to the 3 two-hour lab windows.
    DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    SLOTS = [
        {"index": 0, "label": "10:00-11:00", "start": "10:00", "end": "11:00"},
        {"index": 1, "label": "11:00-12:00", "start": "11:00", "end": "12:00"},
        {"index": 2, "label": "12:40-1:40",  "start": "12:40", "end": "13:40"},
        {"index": 3, "label": "1:40-2:40",   "start": "13:40", "end": "14:40"},
        {"index": 4, "label": "2:50-3:50",   "start": "14:50", "end": "15:50"},
        {"index": 5, "label": "3:50-4:50",   "start": "15:50", "end": "16:50"},
    ]
    BREAKS = [
        {"label": "BREAK", "start": "12:00", "end": "12:40"},
        {"label": "BREAK", "start": "14:40", "end": "14:50"},
    ]
    # Lab windows (pair of consecutive slot indices)
    LAB_SLOTS = [(0, 1), (2, 3), (4, 5)]   # 10-12, 12:40-2:40, 2:50-4:50
    NUM_DAYS  = 5
    NUM_SLOTS = 6   # 6 one-hour theory slots per day


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = DevelopmentConfig()
