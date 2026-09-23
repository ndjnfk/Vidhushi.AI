from datetime import date

from fastapi import APIRouter, Query

from app.astro.panchang import compute_panchang
from app.schemas.schemas import PanchangOut

router = APIRouter(prefix="/panchang", tags=["panchang"])


@router.get("", response_model=PanchangOut)
def get_panchang(
    for_date: date = Query(..., alias="date"),
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    result = compute_panchang(for_date, latitude, longitude)
    return PanchangOut(**vars(result))
