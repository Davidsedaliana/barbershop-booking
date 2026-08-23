"""Инлайн-клавиатуры. Callback-данные компактные: «svc:1», «day:2026-08-26»."""

from datetime import date

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from britva_bot.api import Barber, Service
from britva_bot.helpers import day_label, format_price


def services_kb(services: list[Service]) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=f"{s.name} — {format_price(s.price)}",
                callback_data=f"svc:{s.id}",
            )
        ]
        for s in services
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def barbers_kb(barbers: list[Barber]) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=f"{b.name}" + (f" · {b.title}" if b.title else ""),
                callback_data=f"brb:{b.id}",
            )
        ]
        for b in barbers
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


def days_kb(days: list[date]) -> InlineKeyboardMarkup:
    rows = []
    for i in range(0, len(days), 2):
        rows.append(
            [
                InlineKeyboardButton(text=day_label(d), callback_data=f"day:{d.isoformat()}")
                for d in days[i : i + 2]
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def slots_kb(slots: list[str]) -> InlineKeyboardMarkup:
    rows = []
    for i in range(0, len(slots), 4):
        rows.append(
            [
                InlineKeyboardButton(text=s, callback_data=f"slot:{s}")
                for s in slots[i : i + 4]
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def confirm_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Подтверждаю", callback_data="confirm"),
                InlineKeyboardButton(text="✖️ Отмена", callback_data="cancel"),
            ]
        ]
    )


def start_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="💈 Записаться", callback_data="book")]]
    )
