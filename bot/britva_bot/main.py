"""Запуск бота: long polling. BOT_TOKEN и BACKEND_URL — в bot/.env."""

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from britva_bot.api import BritvaApi
from britva_bot.config import load_env
from britva_bot.handlers import router


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    env = load_env()
    if not env["BOT_TOKEN"]:
        print("BOT_TOKEN не задан — создай бота у @BotFather и положи токен в bot/.env",
              file=sys.stderr)
        sys.exit(1)

    bot = Bot(token=env["BOT_TOKEN"],
              default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    api = BritvaApi(env["BACKEND_URL"])

    dp = Dispatcher()
    dp.include_router(router)
    dp["api"] = api  # DI: хендлеры получают api аргументом

    try:
        await dp.start_polling(bot)
    finally:
        await api.close()


if __name__ == "__main__":
    asyncio.run(main())
