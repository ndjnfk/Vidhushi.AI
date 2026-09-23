"""Thin wrapper around pyswisseph for sidereal (Lahiri) planetary positions.

This is the single source of truth for "where are the planets" — every other
astro module (chart, panchang, dasha, matching) builds on top of this.
"""
from dataclasses import dataclass
from datetime import datetime, timezone

import swisseph as swe

from app.astro.constants import PLANETS

swe.set_sid_mode(swe.SIDM_LAHIRI)

_SWE_PLANET_ID = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mars": swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus": swe.VENUS,
    "Saturn": swe.SATURN,
    "Rahu": swe.MEAN_NODE,  # mean lunar node
}

_SIDEREAL_FLAG = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED


@dataclass
class PlanetPosition:
    name: str
    longitude: float  # sidereal ecliptic longitude, 0-360
    speed: float  # degrees/day; negative = retrograde
    is_retrograde: bool


def julian_day_ut(dt_utc: datetime) -> float:
    """Convert an aware UTC datetime to a Julian Day (UT)."""
    if dt_utc.tzinfo is None:
        raise ValueError("dt_utc must be timezone-aware (UTC)")
    dt_utc = dt_utc.astimezone(timezone.utc)
    hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour)


def ayanamsa(jd_ut: float) -> float:
    return swe.get_ayanamsa_ut(jd_ut)


def planet_positions(jd_ut: float) -> dict[str, PlanetPosition]:
    """Sidereal longitude + speed for Sun..Rahu, plus Ketu (Rahu + 180)."""
    positions: dict[str, PlanetPosition] = {}
    for name in PLANETS:
        if name == "Ketu":
            continue
        planet_id = _SWE_PLANET_ID[name]
        (lon, _lat, _dist, speed, *_rest), _flag = swe.calc_ut(jd_ut, planet_id, _SIDEREAL_FLAG)
        positions[name] = PlanetPosition(
            name=name, longitude=lon % 360.0, speed=speed, is_retrograde=speed < 0,
        )

    rahu = positions["Rahu"]
    ketu_lon = (rahu.longitude + 180.0) % 360.0
    positions["Ketu"] = PlanetPosition(
        name="Ketu", longitude=ketu_lon, speed=rahu.speed, is_retrograde=rahu.is_retrograde,
    )
    return positions


def ascendant_longitude(jd_ut: float, lat: float, lon: float) -> float:
    """Sidereal longitude of the Lagna (ascendant) for the given moment/place."""
    _cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b"W", flags=swe.FLG_SIDEREAL)
    return ascmc[0] % 360.0


def sunrise_sunset(jd_ut_midnight: float, lat: float, lon: float) -> tuple[float, float]:
    """Return (sunrise_jd, sunset_jd) in UT for the day starting at jd_ut_midnight."""
    geopos = (lon, lat, 0.0)
    _res, rise = swe.rise_trans(jd_ut_midnight, swe.SUN, swe.CALC_RISE, geopos)
    _res, setting = swe.rise_trans(jd_ut_midnight, swe.SUN, swe.CALC_SET, geopos)
    return rise[0], setting[0]
