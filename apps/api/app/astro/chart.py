"""D1 (Rashi) and D9 (Navamsa) chart construction — whole-sign houses."""
from dataclasses import dataclass
from datetime import datetime

from app.astro import ephemeris
from app.astro.constants import NAKSHATRA_SPAN, NAKSHATRAS, PADA_SPAN, RASHIS

SIGN_SPAN = 30.0


@dataclass
class PlanetPlacement:
    planet: str
    longitude: float
    sign_index: int  # 0-11
    sign: str
    degree_in_sign: float
    nakshatra: str
    nakshatra_lord: str
    pada: int  # 1-4
    house: int  # 1-12, relative to ascendant
    is_retrograde: bool


@dataclass
class Chart:
    ascendant_sign_index: int
    ascendant_sign: str
    ascendant_degree: float
    planets: list[PlanetPlacement]


def sign_index_of(longitude: float) -> int:
    return int(longitude // SIGN_SPAN) % 12


def nakshatra_of(longitude: float) -> tuple[str, str, int]:
    idx = int(longitude // NAKSHATRA_SPAN) % 27
    pada = int((longitude % NAKSHATRA_SPAN) // PADA_SPAN) + 1
    from app.astro.constants import NAKSHATRA_LORDS
    return NAKSHATRAS[idx], NAKSHATRA_LORDS[idx], pada


def house_of(sign_index: int, asc_sign_index: int) -> int:
    """Whole-sign house: house number counted from the ascendant's sign."""
    return ((sign_index - asc_sign_index) % 12) + 1


def build_d1_chart(jd_ut: float, lat: float, lon: float) -> Chart:
    asc_lon = ephemeris.ascendant_longitude(jd_ut, lat, lon)
    asc_sign = sign_index_of(asc_lon)

    positions = ephemeris.planet_positions(jd_ut)
    placements: list[PlanetPlacement] = []
    for name, pos in positions.items():
        sign_idx = sign_index_of(pos.longitude)
        nak, nak_lord, pada = nakshatra_of(pos.longitude)
        placements.append(PlanetPlacement(
            planet=name,
            longitude=pos.longitude,
            sign_index=sign_idx,
            sign=RASHIS[sign_idx],
            degree_in_sign=pos.longitude % SIGN_SPAN,
            nakshatra=nak,
            nakshatra_lord=nak_lord,
            pada=pada,
            house=house_of(sign_idx, asc_sign),
            is_retrograde=pos.is_retrograde,
        ))

    return Chart(
        ascendant_sign_index=asc_sign,
        ascendant_sign=RASHIS[asc_sign],
        ascendant_degree=asc_lon % SIGN_SPAN,
        planets=placements,
    )


def navamsa_sign_index(longitude: float) -> int:
    """D9 sign for a given D1 longitude.

    Each 30deg sign is split into 9 navamsa parts of 3deg20'. The navamsa
    cycle's starting sign is encoded directly by (sign*9 + part) % 12, which
    reproduces the classical movable/fixed/dual starting-sign rules.
    """
    sign_idx = sign_index_of(longitude)
    degree_in_sign = longitude % SIGN_SPAN
    part = int(degree_in_sign // (SIGN_SPAN / 9))
    return (sign_idx * 9 + part) % 12


def build_d9_chart(d1_chart: Chart) -> Chart:
    asc_navamsa = navamsa_sign_index(
        d1_chart.ascendant_sign_index * SIGN_SPAN + d1_chart.ascendant_degree
    )

    placements: list[PlanetPlacement] = []
    for p in d1_chart.planets:
        nav_sign = navamsa_sign_index(p.longitude)
        placements.append(PlanetPlacement(
            planet=p.planet,
            longitude=p.longitude,
            sign_index=nav_sign,
            sign=RASHIS[nav_sign],
            degree_in_sign=p.degree_in_sign,  # informational only in D9 context
            nakshatra=p.nakshatra,
            nakshatra_lord=p.nakshatra_lord,
            pada=p.pada,
            house=house_of(nav_sign, asc_navamsa),
            is_retrograde=p.is_retrograde,
        ))

    return Chart(
        ascendant_sign_index=asc_navamsa,
        ascendant_sign=RASHIS[asc_navamsa],
        ascendant_degree=0.0,
        planets=placements,
    )
