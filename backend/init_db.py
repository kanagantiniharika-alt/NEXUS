 from pathlib import Path
import sys

from sqlalchemy import create_engine

from backend.config import settings


def init_db(schema_path: str | None = None) -> None:
    """Apply the SQL schema file to the database configured in settings.DATABASE_URL.

    Usage: python backend/init_db.py
    """
    project_root = Path(__file__).resolve().parents[1]
    schema_file = Path(schema_path) if schema_path else project_root / "database" / "schema.sql"

    if not schema_file.exists():
        print(f"Schema file not found: {schema_file}")
        sys.exit(1)

    engine = create_engine(settings.DATABASE_URL)

    sql = schema_file.read_text(encoding="utf-8")

    # Naively split statements on semicolons and execute each non-empty statement.
    # This works for typical DDL files; if you have complex routines, adjust as needed.
    statements = [s.strip() for s in sql.split(';') if s.strip()]

    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.exec_driver_sql(stmt)
            except Exception as e:
                print("Error executing statement:\n", stmt[:200], "\n->", e)
                raise

    print("Database schema applied successfully.")


if __name__ == "__main__":
    # Allow optional path override: python backend/init_db.py path/to/schema.sql
    override = sys.argv[1] if len(sys.argv) > 1 else None
    init_db(override)
