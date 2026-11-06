from app.services.ai_service import generate_chat_response


# TEST 1: Normal conversation
print("\n--- TEST 1: Normal Chat ---")

response = generate_chat_response(
    message="Hey! What can you help me with?",
    language="English"
)

print(response)


# TEST 2: Follow-up conversation
print("\n--- TEST 2: Conversation History ---")

history = [
    {
        "role": "user",
        "content": "I am learning Python."
    },
    {
        "role": "assistant",
        "content": "That's great! Python is beginner-friendly."
    }
]

response = generate_chat_response(
    message="What should I learn next?",
    history=history,
    language="English"
)

print(response)


# TEST 3: Repository-aware conversation
print("\n--- TEST 3: Repository Context ---")

repository_context = [
    {
        "path": "main.py",
        "content": """
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Welcome to RepoSage"}
"""
    }
]

response = generate_chat_response(
    message="Explain what my main.py file does.",
    repository_context=repository_context,
    language="English"
)

print(response)