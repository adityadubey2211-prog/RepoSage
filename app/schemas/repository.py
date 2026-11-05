from pydantic import BaseModel, HttpUrl

class RepositoryRequest(BaseModel):
    url: HttpUrl