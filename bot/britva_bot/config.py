"""Конфиг бота: токен и адрес бэкенда из окружения/.env."""

import os
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def load_env(path: Path = ENV_PATH) -> dict:
    env = {
        "BOT_TOKEN": os.environ.get("BOT_TOKEN", ""),
        "BACKEND_URL": os.environ.get("BACKEND_URL", "http://localhost:3000"),
    }
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key in env and value:
                env[key] = value
    env["BACKEND_URL"] = env["BACKEND_URL"].rstrip("/")
    return env
