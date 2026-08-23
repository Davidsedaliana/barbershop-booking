"""Флоу записи: услуга → барбер → день → время → имя → телефон → подтверждение."""

from datetime import date

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message

from britva_bot.api import BackendError, BritvaApi, SlotTakenError
from britva_bot.helpers import booking_summary, format_price, working_days
from britva_bot.keyboards import (
    barbers_kb,
    confirm_kb,
    days_kb,
    services_kb,
    slots_kb,
    start_kb,
)

router = Router()


class Booking(StatesGroup):
    service = State()
    barber = State()
    day = State()
    slot = State()
    name = State()
    phone = State()
    confirm = State()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(
        "💈 <b>BRITVA</b> — барбершоп в Ереване.\n"
        "Стрижка, после которой оборачиваются.\n\n"
        "Запишу тебя за минуту — жми кнопку.",
        reply_markup=start_kb(),
    )


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Ок, отменил. Начать заново — /start")


@router.callback_query(F.data == "book")
async def start_booking(callback: CallbackQuery, state: FSMContext, api: BritvaApi) -> None:
    services = await api.services()
    await state.set_state(Booking.service)
    await callback.message.edit_text("1/5 · Выбери услугу:", reply_markup=services_kb(services))
    await callback.answer()


@router.callback_query(Booking.service, F.data.startswith("svc:"))
async def pick_service(callback: CallbackQuery, state: FSMContext, api: BritvaApi) -> None:
    service_id = int(callback.data.split(":", 1)[1])
    services = {s.id: s for s in await api.services()}
    service = services[service_id]
    await state.update_data(
        service_id=service.id,
        service_name=f"{service.name} ({format_price(service.price)}, {service.duration_min} мин)",
    )
    barbers = await api.barbers()
    await state.set_state(Booking.barber)
    await callback.message.edit_text("2/5 · К кому пойдём?", reply_markup=barbers_kb(barbers))
    await callback.answer()


@router.callback_query(Booking.barber, F.data.startswith("brb:"))
async def pick_barber(callback: CallbackQuery, state: FSMContext, api: BritvaApi) -> None:
    barber_id = int(callback.data.split(":", 1)[1])
    barbers = {b.id: b for b in await api.barbers()}
    barber = barbers[barber_id]
    await state.update_data(barber_id=barber.id, barber_name=barber.name)
    days = working_days(barber.work_days)
    await state.set_state(Booking.day)
    await callback.message.edit_text(
        f"3/5 · {barber.name} работает в эти дни:", reply_markup=days_kb(days)
    )
    await callback.answer()


@router.callback_query(Booking.day, F.data.startswith("day:"))
async def pick_day(callback: CallbackQuery, state: FSMContext, api: BritvaApi) -> None:
    day = callback.data.split(":", 1)[1]
    data = await state.get_data()
    slots = await api.slots(data["barber_id"], data["service_id"], day)
    if not slots:
        await callback.answer("На этот день всё занято — выбери другой", show_alert=True)
        return
    await state.update_data(date=day)
    await state.set_state(Booking.slot)
    await callback.message.edit_text("4/5 · Свободное время:", reply_markup=slots_kb(slots))
    await callback.answer()


@router.callback_query(Booking.slot, F.data.startswith("slot:"))
async def pick_slot(callback: CallbackQuery, state: FSMContext) -> None:
    time = callback.data.split(":", 1)[1]
    await state.update_data(time=time)
    await state.set_state(Booking.name)
    await callback.message.edit_text("5/5 · Как тебя зовут?")
    await callback.answer()


@router.message(Booking.name, F.text)
async def enter_name(message: Message, state: FSMContext) -> None:
    await state.update_data(name=message.text.strip())
    await state.set_state(Booking.phone)
    await message.answer("И телефон для связи:")


@router.message(Booking.phone, F.text)
async def enter_phone(message: Message, state: FSMContext) -> None:
    await state.update_data(phone=message.text.strip())
    data = await state.get_data()
    summary = booking_summary(
        data["service_name"],
        data["barber_name"],
        date.fromisoformat(data["date"]),
        data["time"],
    )
    await state.set_state(Booking.confirm)
    await message.answer(f"Проверь запись:\n\n{summary}\n\nВсё верно?", reply_markup=confirm_kb())


@router.callback_query(Booking.confirm, F.data == "confirm")
async def confirm(callback: CallbackQuery, state: FSMContext, api: BritvaApi) -> None:
    data = await state.get_data()
    try:
        await api.create_appointment(
            customer_name=data["name"],
            phone=data["phone"],
            service_id=data["service_id"],
            barber_id=data["barber_id"],
            date=data["date"],
            time=data["time"],
        )
    except SlotTakenError:
        slots = await api.slots(data["barber_id"], data["service_id"], data["date"])
        await state.set_state(Booking.slot)
        await callback.message.edit_text(
            "Упс — это время только что заняли. Выбери другое:",
            reply_markup=slots_kb(slots),
        )
        await callback.answer()
        return
    await state.clear()
    summary = booking_summary(
        data["service_name"],
        data["barber_name"],
        date.fromisoformat(data["date"]),
        data["time"],
    )
    await callback.message.edit_text(f"✂️ Ждём тебя!\n\n{summary}\n\nЗаписать ещё — /start")
    await callback.answer()


@router.callback_query(F.data == "cancel")
async def cancel_any(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.message.edit_text("Отменил. Начать заново — /start")
    await callback.answer()


@router.error()
async def on_error(event, state: FSMContext | None = None) -> bool:
    """Бэкенд упал — говорим честно, не молчим."""
    exception = event.exception
    if isinstance(exception, BackendError):
        message = getattr(getattr(event.update, "callback_query", None), "message", None) or getattr(
            event.update, "message", None
        )
        if message:
            await message.answer("Сервис записи прилёг 😔 Попробуй через пару минут: /start")
        return True
    raise exception
