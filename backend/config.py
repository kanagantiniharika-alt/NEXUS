from pathlib import Path
from urllib.parse import quote_plus
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexus Financial Full-Stack System"
    API_V1_STR: str = "/api"

    # Leave empty so it is automatically built from DB_* values
    DATABASE_URL: str = ""

    # Database Configuration
    DB_DRIVER: str = "mysql+pymysql"
    DB_USER: str = "root"          # Change if your MySQL username is different
    DB_PASSWORD: str = "chriss@1012"  # Replace with your actual MySQL password
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "nexus"

    # Only used if you switch to SQLite
    DB_PATH: str = "./database/nexus.db"

    # API Keys
    GEMINI_API_KEY: str = Field(
        default="",
        validation_alias="GEMINI_API_KEY"
    )

    SERP_API_KEY: str = Field(
        default="",
        validation_alias="SERP_API_KEY"
    )

    @model_validator(mode="before")
    @classmethod
    def assemble_database_url(cls, values):
        db_url = values.get("DATABASE_URL")

        # Use DATABASE_URL directly if provided
        if db_url:
            return values

        driver = values.get("DB_DRIVER", "mysql+pymysql")

        # SQLite support
        if driver.startswith("sqlite"):
            db_path = values.get("DB_PATH")
            if not db_path:
                raise ValueError("DB_PATH must be set when using SQLite.")

            path = Path(db_path)
            if not path.is_absolute():
                repo_root = Path(__file__).resolve().parents[1]
                path = (repo_root / path).resolve()

            values["DATABASE_URL"] = f"sqlite:///{path.as_posix()}"
            return values

        # MySQL
        user = quote_plus(str(values.get("DB_USER", "root")))
        password = quote_plus(str(values.get("DB_PASSWORD", "")))
        host = values.get("DB_HOST", "localhost")
        port = values.get("DB_PORT", 3306)
        name = values.get("DB_NAME", "nexus")

        values["DATABASE_URL"] = (
            f"{driver}://{user}:{password}@{host}:{port}/{name}"
        )

        return values

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()