"""Клиент Payload API барбершопа: тот же контракт, что использует сайт."""

from dataclasses import dataclass

import httpx


class BackendError(Exception):
    """Бэкенд недоступен или ответил ошибкой."""


class SlotTakenError(Exception):
    """Слот заняли, пока клиент выбирал."""


@dataclass
class Service:
    id: int
    name: str
    price: int
    duration_min: int


@dataclass
class Barber:
    id: int
    name: str
    title: str
    work_days: list[str]


class BritvaApi:
    def __init__(self, base_url: str, client: httpx.AsyncClient | None = None):
        self._client = client or httpx.AsyncClient(base_url=base_url, timeout=15)

    async def close(self) -> None:
        await self._client.aclose()

    async def _get(self, url: str, params: dict | None = None) -> dict:
        try:
            resp = await self._client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise BackendError(f"Бэкенд недоступен: {e}") from e

    async def services(self) -> list[Service]:
        data = await self._get(
            "/api/services",
            params={"where[active][equals]": "true", "sort": "price", "limit": 20},
        )
        return [
            Service(
                id=doc["id"],
                name=doc["name"],
                price=doc["price"],
                duration_min=doc["durationMin"],
            )
            for doc in data.get("docs", [])
        ]

    async def barbers(self) -> list[Barber]:
        data = await self._get(
            "/api/barbers",
            params={"where[active][equals]": "true", "limit": 10},
        )
        return [
            Barber(
                id=doc["id"],
                name=doc["name"],
                title=doc.get("title") or "",
                work_days=doc.get("workDays") or [],
            )
            for doc in data.get("docs", [])
        ]

    async def slots(self, barber_id: int, service_id: int, date: str) -> list[str]:
        data = await self._get(
            "/api/appointments/slots",
            params={"barber": barber_id, "service": service_id, "date": date},
        )
        return data.get("slots", [])

    async def create_appointment(
        self,
        *,
        customer_name: str,
        phone: str,
        service_id: int,
        barber_id: int,
        date: str,
        time: str,
    ) -> None:
        try:
            resp = await self._client.post(
                "/api/appointments",
                json={
                    "customerName": customer_name,
                    "phone": phone,
                    "service": service_id,
                    "barber": barber_id,
                    "date": date,
                    "time": time,
                },
            )
        except httpx.HTTPError as e:
            raise BackendError(f"Бэкенд недоступен: {e}") from e
        if resp.status_code == 400:
            raise SlotTakenError()
        if resp.is_error:
            raise BackendError(f"Бэкенд ответил {resp.status_code}")
