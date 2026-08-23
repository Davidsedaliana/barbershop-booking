"""Клиент Payload API на httpx.MockTransport — без сети и без бэкенда."""

import httpx
import pytest

from britva_bot.api import BackendError, BritvaApi, SlotTakenError

SERVICES_PAGE = {
    "docs": [
        {"id": 1, "name": "Мужская стрижка", "price": 1500, "durationMin": 60},
        {"id": 2, "name": "Оформление бороды", "price": 1000, "durationMin": 30},
    ]
}

BARBERS_PAGE = {
    "docs": [
        {"id": 3, "name": "Арам", "title": "Основатель", "workDays": ["2", "3"]},
        {"id": 4, "name": "Давид", "title": None, "workDays": None},
    ]
}


def make_api(handler) -> BritvaApi:
    client = httpx.AsyncClient(
        base_url="http://backend", transport=httpx.MockTransport(handler)
    )
    return BritvaApi("http://backend", client=client)


async def test_services_parsed():
    api = make_api(lambda req: httpx.Response(200, json=SERVICES_PAGE))
    services = await api.services()
    assert [s.name for s in services] == ["Мужская стрижка", "Оформление бороды"]
    assert services[0].duration_min == 60


async def test_barbers_null_fields_normalized():
    api = make_api(lambda req: httpx.Response(200, json=BARBERS_PAGE))
    barbers = await api.barbers()
    assert barbers[1].title == ""
    assert barbers[1].work_days == []


async def test_slots_passes_params():
    seen = {}

    def handler(req):
        seen.update(dict(req.url.params))
        return httpx.Response(200, json={"slots": ["10:00", "11:00"]})

    api = make_api(handler)
    slots = await api.slots(3, 1, "2026-08-26")
    assert slots == ["10:00", "11:00"]
    assert seen == {"barber": "3", "service": "1", "date": "2026-08-26"}


async def test_create_appointment_success():
    def handler(req):
        assert req.url.path == "/api/appointments"
        return httpx.Response(201, json={"doc": {"id": 7}})

    api = make_api(handler)
    await api.create_appointment(
        customer_name="Тест", phone="+374", service_id=1, barber_id=3,
        date="2026-08-26", time="14:00",
    )


async def test_create_appointment_taken_slot():
    api = make_api(lambda req: httpx.Response(400, json={"errors": [{"message": "занято"}]}))
    with pytest.raises(SlotTakenError):
        await api.create_appointment(
            customer_name="Тест", phone="+374", service_id=1, barber_id=3,
            date="2026-08-26", time="14:00",
        )


async def test_backend_down_raises_backend_error():
    def handler(req):
        raise httpx.ConnectError("refused")

    api = make_api(handler)
    with pytest.raises(BackendError):
        await api.services()


async def test_server_error_raises_backend_error():
    api = make_api(lambda req: httpx.Response(500))
    with pytest.raises(BackendError):
        await api.create_appointment(
            customer_name="Тест", phone="+374", service_id=1, barber_id=3,
            date="2026-08-26", time="14:00",
        )
