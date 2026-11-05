from pydantic import BaseModel, HttpUrl
from typing import Optional

class RepositoryData(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    stargazers_count: int
    language: Optional[str] = None
    html_url: str
    forks_count: int
    open_issues_count: int
    
class RepositoryFile(BaseModel):
    path:str
    type:str
    
class RepositoryResponse(BaseModel):
    message: str
    repository_data: RepositoryData
    files: list[RepositoryFile]

class FileContentResponse(BaseModel):
    path:str
    content:str