from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    PROJECT_NAME: str = "RepoSage"
    DEBUG: bool = True
    VERSION: str = "2.0.0"

    GEMINI_API_KEY: str

    MONGODB_URL: str
    MONGODB_DATABASE: str = "reposage"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()