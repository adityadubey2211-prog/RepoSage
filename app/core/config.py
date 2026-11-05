from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PROJECT_NAME: str = "RepoSage"
    DEBUG: bool = True
    VERSION: str = "2.0.0"
    
    class Config:
        env_file = ".env"
        
settings = Settings()
