from pathlib import Path
import sys
from sqlalchemy import create_engine

# Ensure project root is on sys.path so `backend` package can be imported
project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Use the SQLAlchemy declarative `Base` from the app models
from backend.database import Base as DeclarativeBase

# Import models so they register with the Base.metadata
import backend.models  # noqa: F401


def create_sqlite_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    sqlite_url = f"sqlite:///{db_path.as_posix()}"

    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

    # Create all tables defined on the Base
    DeclarativeBase.metadata.create_all(engine)

    print(f"SQLite database created at: {db_path}")


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parents[1]
    db_file = project_root / "database" / "nexus.db"
    create_sqlite_db(db_file)
