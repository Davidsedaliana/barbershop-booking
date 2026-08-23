"""Хелперы: дни недели в нотации JS, фильтр рабочих дней, подписи."""

from datetime import date

from britva_bot.helpers import (
    booking_summary,
    day_label,
    format_price,
    js_weekday,
    working_days,
)


def test_js_weekday_matches_backend_notation():
    assert js_weekday(date(2026, 8, 24)) == "1"  # понедельник
    assert js_weekday(date(2026, 8, 29)) == "6"  # суббота
    assert js_weekday(date(2026, 8, 30)) == "0"  # воскресенье — как в JS getDay()


def test_working_days_filters_by_barber_schedule():
    # вт–сб, старт в понедельник 24.08 — понедельники и воскресенья выпадают
    days = working_days(["2", "3", "4", "5", "6"], count=7, today=date(2026, 8, 24))
    assert [d.isoformat() for d in days] == [
        "2026-08-25",
        "2026-08-26",
        "2026-08-27",
        "2026-08-28",
        "2026-08-29",
    ]


def test_working_days_empty_schedule():
    assert working_days([], count=14, today=date(2026, 8, 24)) == []


def test_day_label():
    assert day_label(date(2026, 8, 25)) == "вт, 25 авг"
    assert day_label(date(2026, 12, 31)) == "чт, 31 дек"


def test_format_price():
    assert format_price(1500) == "1 500 ₽"
    assert format_price(999) == "999 ₽"


def test_booking_summary():
    got = booking_summary("Мужская стрижка", "Арам", date(2026, 8, 26), "14:00")
    assert got == "Мужская стрижка\nАрам · ср, 26 авг в 14:00"
