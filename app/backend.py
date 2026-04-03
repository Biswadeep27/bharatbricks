import os
import re

from databricks.sdk import WorkspaceClient
from databricks.sdk.core import Config
from databricks import sql


VOLUME_PATH = os.getenv("VOLUME_PATH", "/Volumes/bharatbricks/iiscb/datasets/arxiv")
WAREHOUSE_ID = os.getenv("DATABRICKS_WAREHOUSE_ID", "")

cfg = Config()


def list_volume_files() -> list[dict]:
    """List JSON files in the UC Volume using app (SP) auth."""
    w = WorkspaceClient()
    files = []
    for f in w.files.list_directory_contents(VOLUME_PATH):
        if f.name and f.name.endswith(".json"):
            files.append(
                {
                    "name": f.name,
                    "path": f.path,
                    "size": f.file_size,
                    "last_modified": str(f.last_modified) if f.last_modified else None,
                }
            )
    return files


def _validate_filename(filename: str) -> str:
    """Validate filename to prevent SQL injection."""
    if not re.match(r"^[\w\-. ]+\.json$", filename):
        raise ValueError(f"Invalid filename: {filename}")
    return filename


def _get_sql_connection(user_token: str | None = None):
    """Get SQL connection. Uses OBO user token when available, falls back to app (SP) auth for local dev."""
    connect_kwargs = {
        "server_hostname": cfg.host,
        "http_path": f"/sql/1.0/warehouses/{WAREHOUSE_ID}",
    }
    if user_token:
        connect_kwargs["access_token"] = user_token
    else:
        connect_kwargs["credentials_provider"] = lambda: cfg.authenticate
    return sql.connect(**connect_kwargs)


def get_file_preview(filename: str, user_token: str | None = None) -> dict:
    """Get schema structure and one sample record.

    Uses OBO user auth when deployed (user_token provided).
    Falls back to app (SP) auth for local development.
    """
    safe_name = _validate_filename(filename)
    file_path = f"{VOLUME_PATH}/{safe_name}"

    conn = _get_sql_connection(user_token)

    try:
        with conn.cursor() as cursor:
            query = (
                f"SELECT * FROM read_files('{file_path}', "
                f"format => 'json', multiLine => 'true') LIMIT 1"
            )
            cursor.execute(query)

            schema = []
            if cursor.description:
                for col_desc in cursor.description:
                    schema.append(
                        {
                            "column_name": col_desc[0],
                            "type": col_desc[1] or "STRING",
                        }
                    )

            row = cursor.fetchone()
            sample_record = {}
            if row and cursor.description:
                for i, col_desc in enumerate(cursor.description):
                    value = row[i]
                    sample_record[col_desc[0]] = (
                        str(value) if value is not None else None
                    )

        return {
            "filename": safe_name,
            "schema": schema,
            "sample_record": sample_record,
        }
    finally:
        conn.close()
