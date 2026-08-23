"""Чистые хелперы: рабочие дни, подписи, форматирование. Покрыты тестами."""

from datetime import date, timedelta

WEEKDAY_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]  # индекс = date.weekday()
MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]


def js_weekday(d: date) -> str:
    """День недели в нотации бэкенда (JS getDay: 0 = воскресенье)."""
    return str((d.weekday() + 1) % 7)


def working_days(work_days: list[str], count: int = 14, today: date | None = None) -> list[date]:
    """Ближайшие count дней, отфильтрованные по рабочим дням барбера."""
    start = today or date.today()
    days = (start + timedelta(days=i) for i in range(count))
    return [d for d in days if js_weekday(d) in work_days]


def day_label(d: date) -> str:
    """«вт, 25 авг» — подпись кнопки дня."""
    return f"{WEEKDAY_SHORT[d.weekday()]}, {d.day} {MONTHS[d.month - 1]}"


def format_price(price: int) -> str:
    """1500 -> «1 500 ₽»"""
    return f"{price:,}".replace(",", " ") + " ₽"


def booking_summary(service: str, barber: str, d: date, time: str) -> str:
    return f"{service}\n{barber} · {day_label(d)} в {time}"
