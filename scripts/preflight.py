"""Validate that Databricks workspace resources exist before running the app."""

import os
import sys

from databricks.sdk import WorkspaceClient


def main():
    print("Running preflight checks...\n")
    ok = True

    # Check env vars
    warehouse_id = os.getenv("DATABRICKS_WAREHOUSE_ID")
    volume_path = os.getenv("VOLUME_PATH", "/Volumes/bharatbricks/iiscb/datasets/arxiv")

    if not warehouse_id:
        print("[WARN] DATABRICKS_WAREHOUSE_ID not set. SQL preview will not work.")

    # Check Databricks connectivity
    try:
        w = WorkspaceClient()
        user = w.current_user.me()
        print(f"[OK] Connected as: {user.user_name}")
    except Exception as e:
        print(f"[FAIL] Cannot connect to Databricks: {e}")
        ok = False

    # Check volume exists
    try:
        files = list(w.files.list_directory_contents(volume_path))
        json_count = sum(1 for f in files if f.name and f.name.endswith(".json"))
        print(f"[OK] Volume accessible: {volume_path} ({json_count} JSON files)")
    except Exception as e:
        print(f"[FAIL] Cannot access volume {volume_path}: {e}")
        ok = False

    if ok:
        print("\nAll preflight checks passed.")
    else:
        print("\nSome checks failed. Fix the issues above before proceeding.")
        sys.exit(1)


if __name__ == "__main__":
    main()
