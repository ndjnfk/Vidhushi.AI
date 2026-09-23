from datetime import time as time_cls

from fastapi import APIRouter, HTTPException

from app.astro.service import chart_to_schema, dasha_to_schema, generate_kundli
from app.models.models import Kundli
from app.schemas.schemas import BirthDetailsIn, KundliOut, PanchangOut

router = APIRouter(prefix="/kundli", tags=["kundli"])


@router.post("/generate", response_model=KundliOut)
async def generate(payload: BirthDetailsIn):
    result = generate_kundli(payload.birth_date, payload.birth_time, payload.latitude, payload.longitude)

    record = Kundli(
        name=payload.name,
        birth_date=payload.birth_date,
        birth_time=payload.birth_time.isoformat(),
        place_name=payload.place_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timezone=result.timezone,
    )
    await record.insert()

    return KundliOut(
        id=str(record.id),
        name=record.name,
        birth_date=record.birth_date,
        birth_time=payload.birth_time,
        place_name=record.place_name,
        timezone=record.timezone,
        d1_chart=chart_to_schema(result.d1),
        d9_chart=chart_to_schema(result.d9),
        dasha=dasha_to_schema(result.dasha),
        panchang=PanchangOut(**vars(result.panchang)),
    )


@router.get("/{kundli_id}", response_model=KundliOut)
async def get_kundli(kundli_id: str):
    record = await Kundli.get(kundli_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Kundli not found")

    birth_time = time_cls.fromisoformat(record.birth_time)
    result = generate_kundli(record.birth_date, birth_time, record.latitude, record.longitude)

    return KundliOut(
        id=str(record.id),
        name=record.name,
        birth_date=record.birth_date,
        birth_time=birth_time,
        place_name=record.place_name,
        timezone=record.timezone,
        d1_chart=chart_to_schema(result.d1),
        d9_chart=chart_to_schema(result.d9),
        dasha=dasha_to_schema(result.dasha),
        panchang=PanchangOut(**vars(result.panchang)),
    )
