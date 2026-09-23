from fastapi import APIRouter

from app.astro.matching import compute_guna_milan
from app.astro.service import generate_kundli
from app.schemas.schemas import GunaMilanIn, GunaMilanOut, KootaOut

router = APIRouter(prefix="/matching", tags=["matching"])


@router.post("/guna-milan", response_model=GunaMilanOut)
def guna_milan(payload: GunaMilanIn):
    boy = generate_kundli(payload.boy.birth_date, payload.boy.birth_time, payload.boy.latitude, payload.boy.longitude)
    girl = generate_kundli(payload.girl.birth_date, payload.girl.birth_time, payload.girl.latitude, payload.girl.longitude)

    boy_moon = next(p.longitude for p in boy.d1.planets if p.planet == "Moon")
    girl_moon = next(p.longitude for p in girl.d1.planets if p.planet == "Moon")

    result = compute_guna_milan(boy_moon, girl_moon)
    return GunaMilanOut(
        kootas=[KootaOut(name=k.name, points=k.points, max_points=k.max_points, note=k.note) for k in result.kootas],
        total_points=result.total_points,
        max_points=result.max_points,
    )
