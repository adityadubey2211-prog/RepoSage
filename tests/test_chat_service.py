from app.services.chat_service import (
    create_chat_session,
    save_chat_message,
    get_chat_history
)

from app.db.database import chat_sessions, chat_messages


# 1. Create a test session
session_id = create_chat_session(
    "test-owner/test-repo",
    "Explain authentication"
)

print("Session created:", session_id)


# 2. Save user message
save_chat_message(
    session_id,
    "user",
    "Explain authentication"
)

print("User message saved!")


# 3. Save AI response
save_chat_message(
    session_id,
    "assistant",
    "Authentication verifies user identity."
)

print("AI response saved!")


# 4. Retrieve chat history
history = get_chat_history(session_id)

print("\nChat History:")

for message in history:
    print(message["role"], ":", message["content"])


# 5. Cleanup test data
chat_messages.delete_many(
    {"session_id": __import__("bson").ObjectId(session_id)}
)

chat_sessions.delete_one(
    {"_id": __import__("bson").ObjectId(session_id)}
)

print("\nTest completed successfully!")