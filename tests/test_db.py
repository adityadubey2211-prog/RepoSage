from app.db.database import (
    check_database_connection,
    create_indexes,
    chat_sessions,
    chat_messages
)

if check_database_connection():

    print("MongoDB Atlas connected successfully!")

    try:
        create_indexes()

        print("Chat session index created!")
        print("Chat message index created!")

        print("Collections:")
        print(chat_sessions.name)
        print(chat_messages.name)

    except Exception as error:
        print("Index creation failed:", error)

else:
    print("MongoDB connection failed!")