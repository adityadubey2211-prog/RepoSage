from pydantic import BaseModel, HttpUrl
from typing import Optional


class RepositoryResponse(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    stargazers_count: int
    language: Optional[str] = None
    html_url: str
    forks_count: int
    ope_issues_count: int
    
    
class RepositoryRequest(BaseModel):
    message: str
    repository_data: RepositoryResponse