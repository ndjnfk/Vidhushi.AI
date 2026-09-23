"""Glue layer: turn raw birth details into charts/dasha/panchang, and the
reverse (schema <-> dataclass) mapping the API routes need."""
from datetime import date, datetime, time

from app.astro import chart as chart_mod
from app.astro import dasha as dasha_mod
from app.astro import ephemeris
from app.astro import panchang as panchang_mod
from app.astro.geotime import resolve_timezone, to_utc
from app.astro.chart import Chart
from app.schemas.schemas import (
    AntardashaOut,
    ChartOut,
    MahadashaOut,
    PanchangOut,
    PlanetOut,
)


def chart_to_schema(c: Chart) -> ChartOut:
    return ChartOut(
        ascendant_sign=c.ascendant_sign,
        ascendant_degree=c.ascendant_degree,
        planets=[
            PlanetOut(
                planet=p.planet,
                longitude=p.longitude,
                sign=p.sign,
                degree_in_sign=p.degree_in_sign,
                nakshatra=p.nakshatra,
                nakshatra_lord=p.nakshatra_lord,
                pada=p.pada,
                house=p.house,
                is_retrograde=p.is_retrograde,
            )
            for p in c.planets
        ],
    )


def dasha_to_schema(periods) -> list[MahadashaOut]:
    return [
        MahadashaOut(
            lord=p.lord,
            start=p.start,
            end=p.end,
            antardashas=[
                AntardashaOut(lord=a.lord, start=a.start, end=a.end) for a in p.antardashas
            ],
        )
        for p in periods
    ]


class GeneratedKundli:
    def __init__(self, timezone: str, jd_ut: float, d1: Chart, d9: Chart, dasha, panchang):
        self.timezone = timezone
        self.jd_ut = jd_ut
        self.d1 = d1
        self.d9 = d9
        self.dasha = dasha
        self.panchang = panchang


def generate_kundli(
    birth_date: date, birth_time: time, latitude: float, longitude: float
) -> GeneratedKundli:
    local_dt = datetime.combine(birth_date, birth_time)
    birth_utc = to_utc(local_dt, latitude, longitude)
    tz_name = resolve_timezone(latitude, longitude)

    jd_ut = ephemeris.julian_day_ut(birth_utc)

    d1 = chart_mod.build_d1_chart(jd_ut, latitude, longitude)
    d9 = chart_mod.build_d9_chart(d1)

    moon_lon = next(p.longitude for p in d1.planets if p.planet == "Moon")
    dasha_periods = dasha_mod.compute_vimshottari(moon_lon, birth_utc)

    panchang = panchang_mod.compute_panchang(birth_date, latitude, longitude)

    return GeneratedKundli(
        timezone=tz_name, jd_ut=jd_ut, d1=d1, d9=d9, dasha=dasha_periods, panchang=panchang,
    )
