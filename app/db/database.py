from pymongo import MongoClient, ASCENDING, DESCENDING
from app.core.config import settings

client = MongoClient(
    settings.MONGODB_URL,
    serverSelectionTimeoutMS=5000
)

database = client[settings.MONGODB_DATABASE]

# Chatbot collections
chat_sessions = database["chat_sessions"]
chat_messages = database["chat_messages"]


def check_database_connection():
    try:
        client.admin.command("ping")
        return True
    except Exception as error:
        print("MongoDB connection error:", error)
        return False


def create_indexes():

    # Faster session retrieval
    chat_sessions.create_index(
        [("updated_at", DESCENDING)]
    )

    # Faster message retrieval for a particular session
    chat_messages.create_index(
        [
            ("session_id", ASCENDING),
            ("created_at", ASCENDING)
        ]
    )