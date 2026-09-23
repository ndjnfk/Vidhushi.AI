"""Vimshottari Dasha: Mahadasha + Antardasha timeline from Moon's birth nakshatra."""
from dataclasses import dataclass
from datetime import datetime, timedelta

from app.astro.constants import (
    DASHA_LORD_SEQUENCE,
    NAKSHATRA_LORDS,
    NAKSHATRA_SPAN,
    VIMSHOTTARI_YEARS,
)

YEAR_DAYS = 365.2425  # standard Vimshottari year length


@dataclass
class DashaPeriod:
    lord: str
    start: datetime
    end: datetime
    antardashas: list["DashaPeriod"]


def _next_lord(lord: str) -> str:
    i = DASHA_LORD_SEQUENCE.index(lord)
    return DASHA_LORD_SEQUENCE[(i + 1) % 9]


def _build_antardashas(maha_lord: str, start: datetime, maha_years: float) -> list[DashaPeriod]:
    antardashas: list[DashaPeriod] = []
    cursor = start
    lord = maha_lord
    for _ in range(9):
        antar_years = maha_years * (VIMSHOTTARI_YEARS[lord] / 120.0)
        antar_days = antar_years * YEAR_DAYS
        end = cursor + timedelta(days=antar_days)
        antardashas.append(DashaPeriod(lord=lord, start=cursor, end=end, antardashas=[]))
        cursor = end
        lord = _next_lord(lord)
    return antardashas


def compute_vimshottari(moon_longitude: float, birth_utc: datetime, cycles: int = 9) -> list[DashaPeriod]:
    """Full Mahadasha timeline (with Antardashas) starting from birth.

    `cycles` mahadashas are generated (9 covers the whole 120-year wheel
    starting mid-cycle, which is always enough to reach old age).
    """
    nak_index = int(moon_longitude // NAKSHATRA_SPAN) % 27
    birth_lord = NAKSHATRA_LORDS[nak_index]

    fraction_into_nakshatra = (moon_longitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN
    fraction_remaining = 1.0 - fraction_into_nakshatra

    first_maha_years = VIMSHOTTARI_YEARS[birth_lord] * fraction_remaining

    periods: list[DashaPeriod] = []
    cursor = birth_utc
    lord = birth_lord
    for i in range(cycles):
        maha_years = first_maha_years if i == 0 else VIMSHOTTARI_YEARS[lord]
        maha_days = maha_years * YEAR_DAYS
        end = cursor + timedelta(days=maha_days)
        periods.append(DashaPeriod(
            lord=lord,
            start=cursor,
            end=end,
            antardashas=_build_antardashas(lord, cursor, maha_years),
        ))
        cursor = end
        lord = _next_lord(lord)

    return periods
