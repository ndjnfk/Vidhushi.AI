"""Panchang: Tithi, Nakshatra, Yoga, Karana, Vara for a given date + place."""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import swisseph as swe

from app.astro import ephemeris
from app.astro.constants import NAKSHATRA_SPAN, NAKSHATRAS

TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Purnima",
] * 1  # 15 names, reused for both Shukla and Krishna paksha

YOGA_NAMES = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva",
    "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana",
    "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
    "Brahma", "Indra", "Vaidhriti",
]

KARANA_NAMES = [
    "Bava", "Balava", "Kaulava", "Taitila", "Garija", "Vanija", "Vishti",
]
FIXED_KARANAS = {57: "Shakuni", 58: "Chatushpada", 59: "Naga", 0: "Kimstughna"}

VARA_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@dataclass
class Panchang:
    date: str
    vara: str
    tithi: str
    tithi_paksha: str  # Shukla or Krishna
    nakshatra: str
    yoga: str
    karana: str
    sunrise_utc: datetime
    sunset_utc: datetime


def _tithi(sun_lon: float, moon_lon: float) -> tuple[str, str, int]:
    diff = (moon_lon - sun_lon) % 360.0
    index = int(diff // 12.0)  # 0-29
    paksha = "Shukla" if index < 15 else "Krishna"
    name_index = index % 15
    name = "Purnima" if index == 14 else ("Amavasya" if index == 29 else TITHI_NAMES[name_index])
    return name, paksha, index


def _karana(sun_lon: float, moon_lon: float) -> str:
    diff = (moon_lon - sun_lon) % 360.0
    karana_index = int(diff // 6.0)  # 0-59
    if karana_index in FIXED_KARANAS:
        return FIXED_KARANAS[karana_index]
    return KARANA_NAMES[(karana_index - 1) % 7]


def _yoga(sun_lon: float, moon_lon: float) -> str:
    total = (sun_lon + moon_lon) % 360.0
    index = int(total // NAKSHATRA_SPAN) % 27
    return YOGA_NAMES[index]


def _nakshatra(moon_lon: float) -> str:
    index = int(moon_lon // NAKSHATRA_SPAN) % 27
    return NAKSHATRAS[index]


def compute_panchang(local_date, lat: float, lon: float) -> Panchang:
    """local_date: a date (no time) for which to compute the day's panchang.

    The sunrise/sunset search must start from local midnight (converted to
    UTC), not UTC midnight — otherwise, for places east of Greenwich, the
    search window has already drifted into local morning/afternoon and
    `rise_trans` returns the *next* day's sunrise instead of today's.
    """
    from datetime import time as time_cls

    from app.astro.geotime import to_utc

    local_midnight_utc = to_utc(datetime.combine(local_date, time_cls(0, 0)), lat, lon)
    jd_midnight = ephemeris.julian_day_ut(local_midnight_utc)

    sunrise_jd, sunset_jd = ephemeris.sunrise_sunset(jd_midnight, lat, lon)
    y, m, d, h = swe.revjul(sunrise_jd)
    sunrise_utc = datetime(y, m, d, tzinfo=timezone.utc) + timedelta(hours=h)
    y, m, d, h = swe.revjul(sunset_jd)
    sunset_utc = datetime(y, m, d, tzinfo=timezone.utc) + timedelta(hours=h)

    positions = ephemeris.planet_positions(sunrise_jd)
    sun_lon = positions["Sun"].longitude
    moon_lon = positions["Moon"].longitude

    tithi_name, paksha, _tithi_idx = _tithi(sun_lon, moon_lon)
    vara = VARA_NAMES[int(sunrise_jd + 1.5) % 7]

    return Panchang(
        date=local_date.isoformat(),
        vara=vara,
        tithi=tithi_name,
        tithi_paksha=paksha,
        nakshatra=_nakshatra(moon_lon),
        yoga=_yoga(sun_lon, moon_lon),
        karana=_karana(sun_lon, moon_lon),
        sunrise_utc=sunrise_utc,
        sunset_utc=sunset_utc,
    )
