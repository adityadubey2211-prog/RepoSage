from pydantic import BaseModel, HttpUrl


class RepositoryRequest(BaseModel):
    url: HttpUrl


class SelectedFilesRequest(BaseModel):
    files: list[str]


class FileExplanationRequest(BaseModel):
    file_path: str
    language: str = "English"