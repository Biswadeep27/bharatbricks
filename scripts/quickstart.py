"""One-command setup: preflight checks then start the app."""

from scripts.preflight import main as preflight
from scripts.start_app import main as start_app


def main():
    preflight()
    print("\nStarting app...\n")
    start_app()


if __name__ == "__main__":
    main()
