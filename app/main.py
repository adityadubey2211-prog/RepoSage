from fastapi import FastAPI, HTTPException
from app.core.config import settings
from app.schemas.repository import RepositoryRequest, SelectedFilesRequest
from app.schemas.repository_response import(
    RepositoryResponse,
    FileContentResponse
)

from app.services.github_service import (
    extract_repo_details,
    get_repository,
    get_repository_tree,
    get_file_content,
    categorize_files,
    get_selected_file_contents
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered GitHub Repository Intelligence Platform",
    version=settings.VERSION,
    debug=settings.DEBUG
)

@app.get("/")
def home():
    return {
        "message": "Welcome to RepoSage 2.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.post("/repositories", response_model=RepositoryResponse)
def analyze_repository(repository: RepositoryRequest):
    try:
        owner, repo = extract_repo_details(repository.url)
        repository_data = get_repository(owner, repo)
        if repository_data is None:
            raise HTTPException(
                status_code = 404,
                detail = "Repository not found or GitHub API request failed"
            )
            
        branch = repository_data["default_branch"]
        files = get_repository_tree(owner, repo, branch)
        if files is None:
            raise HTTPException(
                status_code = 404,
                detail = "Repository tree not found or GitHub API request failed"
            )
        categorized_files = categorize_files(files)
        return RepositoryResponse(
            message="Repository fetched successfully",
            repository_data=repository_data,
            files=files,
            categorized_files=categorized_files
        )
    except ValueError as error:
        raise HTTPException(
            status_code = 400,
            detail = str(error)
        )
        
@app.get("/repositories/{owner}/{repo}/files/{file_path:path}", response_model=FileContentResponse)
def fetch_file_content(owner: str, repo: str, file_path: str):
    content = get_file_content(owner, repo, file_path)
    if content is None:
        raise HTTPException(
            status_code = 404,
            detail = "File not found or GitHub API request failed"
        )
    return FileContentResponse(
        path=file_path,
        content=content
    )
@app.post("/repositories/{owner}/{repo}/selected-files")
def fetch_selected_files(
    owner: str,
    repo: str,
    request: SelectedFilesRequest
):
    file_contents = get_selected_file_contents(
        owner,
        repo,
        request.files
    )

    if not file_contents:
        raise HTTPException(
            status_code=404,
            detail="No file contents could be fetched"
        )

    return {
        "message": "Selected files fetched successfully",
        "total_files": len(file_contents),
        "files": file_contents
    }