"""Glue layer: turn raw birth details into charts/dasha/panchang, and the
reverse (schema <-> dataclass) mapping the API routes need."""
from datetime import date, datetime, time

from app.astro import chart as chart_mod
from app.astro import dasha as dasha_mod
from app.astro import doshas as doshas_mod
from app.astro import ephemeris
from app.astro import panchang as panchang_mod
from app.astro.geotime import resolve_timezone, to_utc
from app.astro.chart import Chart
from app.astro.constants import RASHIS
from app.schemas.schemas import (
    AntardashaOut,
    AvakhadaOut,
    ChartOut,
    DoshasOut,
    MahadashaOut,
    PanchangOut,
    PeriodOut,
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
                dignity=doshas_mod.dignity(p.planet, p.sign_index),
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


def doshas_to_schema(d: doshas_mod.Doshas) -> DoshasOut:
    return DoshasOut(
        manglik_from_lagna=d.manglik_from_lagna,
        manglik_from_moon=d.manglik_from_moon,
        manglik_from_venus=d.manglik_from_venus,
        mars_house=d.mars_house,
        mars_house_from_moon=d.mars_house_from_moon,
        manglik_cancellations=d.manglik_cancellations,
        manglik_severity=d.manglik_severity,
        seventh_aspected_by=d.seventh_aspected_by,
        kaal_sarp=d.kaal_sarp,
        kaal_sarp_type=d.kaal_sarp_type,
        sade_sati=d.sade_sati,
        saturn_transit_sign=RASHIS[d.saturn_transit_sign_index],
        dhaiya=d.dhaiya,
        sade_sati_periods=[PeriodOut(start=p.start, end=p.end) for p in d.sade_sati_periods],
        pitra=d.pitra,
        pitra_reasons=d.pitra_reasons,
    )


def avakhada_to_schema(a: doshas_mod.Avakhada) -> AvakhadaOut:
    return AvakhadaOut(**vars(a))


class GeneratedKundli:
    def __init__(self, timezone: str, jd_ut: float, d1: Chart, d9: Chart, dasha, panchang, doshas, avakhada):
        self.timezone = timezone
        self.jd_ut = jd_ut
        self.d1 = d1
        self.d9 = d9
        self.dasha = dasha
        self.panchang = panchang
        self.doshas = doshas
        self.avakhada = avakhada


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
        doshas=doshas_mod.compute_doshas(d1, birth=birth_utc),
        avakhada=doshas_mod.compute_avakhada(d1),
    )
