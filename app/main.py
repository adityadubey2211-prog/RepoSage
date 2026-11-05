from fastapi import FastAPI, HTTPException
from app.core.config import settings
from app.schemas.repository import RepositoryRequest
from app.services.github_service import (
    extract_repo_details,
    get_repository
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

@app.post("/repositories")
def analyze_repository(repository: RepositoryRequest):
    try:
        owner, repo = extract_repo_details(repository.url)
        repository_data = get_repository(owner, repo)
        if repository_data is None:
            raise HTTPException(
                status_code = 404,
                detail = "Repository not found or GitHub API request failed"
            )
            
        return{
            "message" : "Repository fetched successfully",
            "repository_data" : repository_data
        }
    except ValueError as error:
        raise HTTPException(
            status_code = 400,
            detail = str(error)
        )