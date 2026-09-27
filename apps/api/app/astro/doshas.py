"""Facts for the kundli report: planetary dignity, aspects, Avakhada details
and the common doshas (Manglik, Kaal Sarp, Sade Sati, Pitra). Only facts are
computed here — the website turns them into readable text."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from app.astro import ephemeris
from app.astro.chart import Chart, sign_index_of
from app.astro.constants import GANA, NADI, RASHI_LORDS, RASHIS, VARNA_GROUP, VASHYA_GROUP, YONI_ANIMAL
from app.astro.dasha import YEAR_DAYS

# Exaltation sign index per planet; debilitation is the opposite sign.
EXALTATION = {"Sun": 0, "Moon": 1, "Mars": 9, "Mercury": 5, "Jupiter": 3, "Venus": 11, "Saturn": 6}

MANGLIK_HOUSES = {1, 2, 4, 7, 8, 12}
SADE_SATI_PHASES = {11: "rising", 0: "peak", 1: "setting"}  # Saturn's sign counted from the Moon's (0-based)
DHAIYA = {3: "fourth", 7: "eighth"}

# Houses (counted from the planet, 1 = its own) that each planet aspects.
SPECIAL_ASPECTS = {"Mars": (4, 7, 8), "Jupiter": (5, 7, 9), "Saturn": (3, 7, 10), "Rahu": (5, 7, 9), "Ketu": (5, 7, 9)}

# Manglik is cancelled when Mars sits in these signs in these houses (a common rule set).
MANGLIK_CANCEL_SIGNS = {1: {0}, 2: {2, 5}, 4: {0, 7}, 7: {3, 9}, 8: {8, 11}, 12: {1, 6}}

KAAL_SARP_TYPES = ["Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma",
                   "Takshak", "Karkotak", "Shankhachud", "Ghatak", "Vishdhar", "Sheshnag"]

TATVA = ["Fire", "Earth", "Air", "Water"]  # by sign index % 4


def dignity(planet: str, sign_index: int) -> str:
    """"exalted" | "debilitated" | "own" | "" (Rahu/Ketu: always "")."""
    ex = EXALTATION.get(planet)
    if ex is None:
        return ""
    if sign_index == ex:
        return "exalted"
    if sign_index == (ex + 6) % 12:
        return "debilitated"
    if RASHI_LORDS[sign_index] == planet:
        return "own"
    return ""


def aspected_houses(planet: str, house: int) -> set[int]:
    """Houses (1-12) a planet in `house` aspects, whole-sign."""
    return {((house - 1 + n - 1) % 12) + 1 for n in SPECIAL_ASPECTS.get(planet, (7,))}


@dataclass
class Avakhada:
    varna: str
    vashya: str
    yoni: str
    gana: str
    nadi: str
    tatva: str
    moon_sign_lord: str
    sun_sign: str


def compute_avakhada(d1: Chart) -> Avakhada:
    by_name = {p.planet: p for p in d1.planets}
    moon, sun = by_name["Moon"], by_name["Sun"]
    nak = int(moon.longitude // (360.0 / 27.0)) % 27
    return Avakhada(
        varna=VARNA_GROUP[moon.sign], vashya=VASHYA_GROUP[moon.sign], yoni=YONI_ANIMAL[nak],
        gana=GANA[nak], nadi=NADI[nak], tatva=TATVA[moon.sign_index % 4],
        moon_sign_lord=RASHI_LORDS[moon.sign_index], sun_sign=RASHIS[sun.sign_index],
    )


@dataclass
class Period:
    start: datetime
    end: datetime


@dataclass
class Doshas:
    manglik_from_lagna: bool
    manglik_from_moon: bool
    mars_house: int
    kaal_sarp: bool
    sade_sati: str  # "none" | "rising" | "peak" | "setting"
    saturn_transit_sign_index: int
    manglik_from_venus: bool = False
    mars_house_from_moon: int = 0
    manglik_cancellations: list[str] = field(default_factory=list)
    manglik_severity: str = "none"  # "none" | "cancelled" | "mild" | "strong"
    seventh_aspected_by: list[str] = field(default_factory=list)
    kaal_sarp_type: str = ""
    dhaiya: str = ""  # "" | "fourth" | "eighth"
    sade_sati_periods: list[Period] = field(default_factory=list)
    pitra: bool = False
    pitra_reasons: list[str] = field(default_factory=list)


def _house_from(sign_index: int, from_sign: int) -> int:
    return ((sign_index - from_sign) % 12) + 1


def _saturn_sign(when: datetime) -> int:
    return sign_index_of(ephemeris.planet_longitude(ephemeris.julian_day_ut(when), "Saturn"))


def sade_sati_periods(moon_sign: int, birth: datetime, years: int = 100) -> list[Period]:
    """Every Sade Sati (Saturn in the 12th, 1st or 2nd sign from the Moon)
    within `years` of birth. Short exits caused by Saturn's retrograde
    motion are merged into the surrounding period."""
    signs = {(moon_sign - 1) % 12, moon_sign, (moon_sign + 1) % 12}
    step = timedelta(days=10)
    periods: list[Period] = []
    start: datetime | None = None
    t, stop = birth, birth + timedelta(days=years * YEAR_DAYS)
    while t <= stop:
        inside = _saturn_sign(t) in signs
        if inside and start is None:
            start = t
        elif not inside and start is not None:
            if periods and (start - periods[-1].end).days < 400:
                periods[-1].end = t
            else:
                periods.append(Period(start, t))
            start = None
        t += step
    if start is not None:
        periods.append(Period(start, t))
    return periods


def compute_doshas(d1: Chart, now: datetime | None = None, birth: datetime | None = None) -> Doshas:
    by_name = {p.planet: p for p in d1.planets}
    mars, moon, venus, sun = by_name["Mars"], by_name["Moon"], by_name["Venus"], by_name["Sun"]
    jupiter, saturn, rahu, ketu = by_name["Jupiter"], by_name["Saturn"], by_name["Rahu"], by_name["Ketu"]

    # --- Manglik
    from_moon = _house_from(mars.sign_index, moon.sign_index)
    from_venus = _house_from(mars.sign_index, venus.sign_index)
    sources = [mars.house in MANGLIK_HOUSES, from_moon in MANGLIK_HOUSES, from_venus in MANGLIK_HOUSES]
    cancellations: list[str] = []
    if any(sources):
        if mars.sign_index in (0, 7, 9):
            cancellations.append("mars_strong_sign")
        if mars.sign_index in MANGLIK_CANCEL_SIGNS.get(mars.house, set()):
            cancellations.append("house_sign")
        if jupiter.sign_index == mars.sign_index:
            cancellations.append("jupiter_with_mars")
        elif mars.house in aspected_houses("Jupiter", jupiter.house):
            cancellations.append("jupiter_aspects_mars")
        if jupiter.house == 1 or venus.house == 1:
            cancellations.append("benefic_in_lagna")
    n = sum(sources)
    severity = "none" if n == 0 else "cancelled" if cancellations else "mild" if n == 1 else "strong"
    seventh_aspected_by = [p.planet for p in d1.planets
                           if p.planet in ("Mars", "Saturn", "Rahu", "Ketu", "Sun") and 7 in aspected_houses(p.planet, p.house)]

    # --- Kaal Sarp: all seven planets fall on one side of the Rahu–Ketu axis.
    sides = {(p.longitude - rahu.longitude) % 360.0 < 180.0 for p in d1.planets if p.planet not in ("Rahu", "Ketu")}
    kaal_sarp = len(sides) == 1

    # --- Sade Sati / Dhaiya (Saturn's transit today, and over the lifetime)
    now = now or datetime.now(timezone.utc)
    saturn_now = _saturn_sign(now)
    from_moon_now = (saturn_now - moon.sign_index) % 12

    # --- Pitra
    pitra_reasons = []
    if sun.sign_index == rahu.sign_index:
        pitra_reasons.append("sun_rahu")
    if sun.sign_index == ketu.sign_index:
        pitra_reasons.append("sun_ketu")
    if sun.sign_index == saturn.sign_index:
        pitra_reasons.append("sun_saturn")
    if rahu.house == 9:
        pitra_reasons.append("rahu_9th")

    return Doshas(
        manglik_from_lagna=sources[0],
        manglik_from_moon=sources[1],
        manglik_from_venus=sources[2],
        mars_house=mars.house,
        mars_house_from_moon=from_moon,
        manglik_cancellations=cancellations,
        manglik_severity=severity,
        seventh_aspected_by=seventh_aspected_by,
        kaal_sarp=kaal_sarp,
        kaal_sarp_type=KAAL_SARP_TYPES[rahu.house - 1] if kaal_sarp else "",
        sade_sati=SADE_SATI_PHASES.get(from_moon_now, "none"),
        saturn_transit_sign_index=saturn_now,
        dhaiya=DHAIYA.get(from_moon_now, ""),
        sade_sati_periods=sade_sati_periods(moon.sign_index, birth) if birth else [],
        pitra=bool(pitra_reasons),
        pitra_reasons=pitra_reasons,
    )
