import re

from app.services.github_service import (
    get_repository,
    get_repository_tree,
    get_file_content
)


IGNORED_FOLDERS = {
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    ".git",
    "dist",
    "build"
}

IGNORED_FILES = {
    ".env",
    ".env.local",
    ".env.production"
}

ALLOWED_EXTENSIONS = (
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".html", ".css", ".json", ".sql",
    ".cpp", ".java", ".go", ".md"
)


def get_repository_context(owner, repo, question):

    repository_data = get_repository(owner, repo)

    if repository_data is None:
        return []

    branch = repository_data["default_branch"]

    files = get_repository_tree(owner, repo, branch)

    if files is None:
        return []

    question_words = set(
        re.findall(r"[a-zA-Z0-9_]+", question.lower())
    )

    ranked_files = []

    for file in files:

        if file["type"] != "blob":
            continue

        path = file["path"]
        filename = path.split("/")[-1]
        lower_path = path.lower()

        if any(
            folder in lower_path.split("/")
            for folder in IGNORED_FOLDERS
        ):
            continue

        if filename.lower() in IGNORED_FILES:
            continue

        if not lower_path.endswith(ALLOWED_EXTENSIONS):
            continue

        path_words = set(
            re.findall(r"[a-zA-Z0-9_]+", lower_path)
        )

        score = len(question_words.intersection(path_words))

        if filename.lower() in {
            "readme.md", "main.py", "app.py"
        }:
            score += 2

        if score > 0:
            ranked_files.append((score, path))

    ranked_files.sort(reverse=True)

    selected_files = ranked_files[:5]

    context = []

    for score, path in selected_files:

        content = get_file_content(owner, repo, path)

        if content is None:
            continue

        context.append({
            "path": path,
            "content": content[:12000]
        })

    return context