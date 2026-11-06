from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from app.schemas.chat import ChatRequest, ChatResponse

from app.services.chat_service import (
    create_chat_session,
    save_chat_message,
    get_chat_history
)

from app.services.context_service import get_repository_context
from app.services.ai_service import generate_chat_response

from app.db.database import chat_sessions


router = APIRouter(
    prefix="/repositories",
    tags=["AI Chat"]
)


@router.post(
    "/{owner}/{repo}/chat",
    response_model=ChatResponse
)
def chat_with_repository(
    owner: str,
    repo: str,
    request: ChatRequest
):

    repository = f"{owner}/{repo}"

    try:

        # Step 1: Create or validate session
        if request.session_id:

            try:
                session_object_id = ObjectId(request.session_id)
            except InvalidId:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid session ID"
                )

            session = chat_sessions.find_one({
                "_id": session_object_id
            })

            if session is None:
                raise HTTPException(
                    status_code=404,
                    detail="Chat session not found"
                )

            if session["repository"] != repository:
                raise HTTPException(
                    status_code=400,
                    detail="Session belongs to another repository"
                )

            session_id = request.session_id

        else:

            session_id = create_chat_session(
                repository,
                request.message
            )

        # Step 2: Retrieve previous conversation
        history = get_chat_history(session_id)

        # Step 3: Save current user message
        save_chat_message(
            session_id,
            "user",
            request.message
        )

        # Step 4: Retrieve repository context
        context = get_repository_context(
            owner,
            repo,
            request.message
        )

        # Step 5: Generate Gemini response
        reply = generate_chat_response(
            message=request.message,
            history=history,
            repository_context=context,
            language=request.language
        )

        # Step 6: Save AI response
        save_chat_message(
            session_id,
            "assistant",
            reply
        )

        return ChatResponse(
            session_id=session_id,
            reply=reply
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Chat generation failed: {str(error)}"
        )