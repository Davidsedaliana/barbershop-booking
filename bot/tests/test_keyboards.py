"""Клавиатуры: callback-данные и раскладка кнопок."""

from datetime import date

from britva_bot.api import Barber, Service
from britva_bot.keyboards import barbers_kb, days_kb, services_kb, slots_kb


def test_services_kb_callback_data():
    kb = services_kb([Service(id=1, name="Стрижка", price=1500, duration_min=60)])
    button = kb.inline_keyboard[0][0]
    assert button.callback_data == "svc:1"
    assert "1 500 ₽" in button.text


def test_barbers_kb_title_optional():
    kb = barbers_kb([
        Barber(id=3, name="Арам", title="Основатель", work_days=[]),
        Barber(id=4, name="Давид", title="", work_days=[]),
    ])
    assert kb.inline_keyboard[0][0].text == "Арам · Основатель"
    assert kb.inline_keyboard[1][0].text == "Давид"


def test_days_kb_two_per_row():
    days = [date(2026, 8, 25), date(2026, 8, 26), date(2026, 8, 27)]
    kb = days_kb(days)
    assert len(kb.inline_keyboard) == 2
    assert kb.inline_keyboard[0][0].callback_data == "day:2026-08-25"


def test_slots_kb_four_per_row_and_full_time_in_callback():
    kb = slots_kb(["10:00", "11:00", "12:00", "13:00", "14:00"])
    assert len(kb.inline_keyboard) == 2
    assert kb.inline_keyboard[0][3].callback_data == "slot:13:00"
    assert kb.inline_keyboard[1][0].text == "14:00"
