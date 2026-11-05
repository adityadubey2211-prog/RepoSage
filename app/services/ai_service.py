
from google import genai
from app.core.config import settings

client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


def test_gemini_connection():

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents="Reply with exactly: RepoSage AI connected!"
    )

    return response.text


def generate_file_explanation(file_path, code, language="English"):

    prompt = f"""
You are RepoSage, an expert programming tutor.

Your task is to explain the provided source code in {language}.

File path: {file_path}

Source code:
{code}

Follow this structure:

1. 📌 File Overview
   Explain what this file does.

2. 🎯 Purpose
   Explain why this file might be needed.

3. ⚙️ Code Explanation
   Explain the important code sections step by step.

4. 🔄 Execution Flow
   Explain how the code executes.

5. 💡 Important Concepts
   Explain technical concepts in beginner-friendly language.

6. 📝 Summary
   Give a short conclusion.

Rules:
- Explain only the provided file.
- Use simple, beginner-friendly language.
- Use meaningful emojis.
- Explain technical terms whenever necessary.
- Never invent functionality that is not present in the code.
- If something cannot be determined from this file alone, mention it.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt
    )

    return response.text
