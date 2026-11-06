from datetime import datetime, timezone
from bson import ObjectId

from app.db.database import chat_sessions, chat_messages


def create_chat_session(repository, first_message):

    current_time = datetime.now(timezone.utc)

    session = {
        "repository": repository,
        "title": first_message[:60],
        "created_at": current_time,
        "updated_at": current_time
    }

    result = chat_sessions.insert_one(session)

    return str(result.inserted_id)


def save_chat_message(session_id, role, content):

    current_time = datetime.now(timezone.utc)

    message = {
        "session_id": ObjectId(session_id),
        "role": role,
        "content": content,
        "created_at": current_time
    }

    chat_messages.insert_one(message)

    chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"updated_at": current_time}}
    )


def get_chat_history(session_id):

    messages = chat_messages.find(
        {"session_id": ObjectId(session_id)}
    ).sort("created_at", 1)

    return [
        {
            "role": message["role"],
            "content": message["content"]
        }
        for message in messages
    ]