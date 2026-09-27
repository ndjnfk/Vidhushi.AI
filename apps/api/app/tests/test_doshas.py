from datetime import datetime, timezone

from app.astro import ephemeris
from app.astro.chart import Chart, PlanetPlacement, build_d1_chart, sign_index_of
from app.astro.doshas import compute_avakhada, compute_doshas, dignity, sade_sati_periods


def _chart(asc: int, longitudes: dict[str, float]) -> Chart:
    planets = []
    for name, lon in longitudes.items():
        s = sign_index_of(lon)
        planets.append(PlanetPlacement(planet=name, longitude=lon, sign_index=s, sign="", degree_in_sign=lon % 30,
                                       nakshatra="", nakshatra_lord="", pada=1, house=((s - asc) % 12) + 1,
                                       is_retrograde=False))
    return Chart(ascendant_sign_index=asc, ascendant_sign="", ascendant_degree=0.0, planets=planets)


def test_dignity():
    assert dignity("Sun", 0) == "exalted" and dignity("Sun", 6) == "debilitated"
    assert dignity("Saturn", 10) == "own" and dignity("Mars", 2) == ""
    assert dignity("Rahu", 1) == ""


def test_manglik_and_kaal_sarp():
    # Lagna Mesha; Mars in Tula (7th). Every planet between Rahu (0°) and Ketu (180°).
    c = _chart(0, {"Sun": 10, "Moon": 40, "Mars": 185, "Mercury": 20, "Jupiter": 100, "Venus": 50,
                   "Saturn": 150, "Rahu": 0.5, "Ketu": 180.5})
    d = compute_doshas(c, now=datetime(2026, 1, 1, tzinfo=timezone.utc))
    assert d.manglik_from_lagna and d.mars_house == 7
    assert not d.kaal_sarp  # Mars at 185° is on the other side of the axis

    c.planets[2] = _chart(0, {"Mars": 170}).planets[0]
    d = compute_doshas(c, now=datetime(2026, 1, 1, tzinfo=timezone.utc))
    assert d.kaal_sarp and not d.manglik_from_lagna  # Mars in Kanya = 6th house


def test_sade_sati_phase_follows_saturn_transit():
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    saturn = sign_index_of(ephemeris.planet_positions(ephemeris.julian_day_ut(now))["Saturn"].longitude)
    base = {"Sun": 10, "Mars": 40, "Mercury": 20, "Jupiter": 100, "Venus": 50, "Saturn": 150, "Rahu": 1, "Ketu": 181}
    for moon_sign, phase in [(saturn, "peak"), ((saturn + 1) % 12, "rising"), ((saturn - 1) % 12, "setting"), ((saturn + 5) % 12, "none")]:
        d = compute_doshas(_chart(0, {**base, "Moon": moon_sign * 30 + 5}), now=now)
        assert d.sade_sati == phase and d.saturn_transit_sign_index == saturn


def test_real_chart_runs():
    d1 = build_d1_chart(ephemeris.julian_day_ut(datetime(1990, 6, 15, 10, 30, tzinfo=timezone.utc)), 28.61, 77.21)
    d = compute_doshas(d1)
    assert d.sade_sati in {"none", "rising", "peak", "setting"} and 1 <= d.mars_house <= 12


def test_aspects():
    from app.astro.doshas import aspected_houses
    assert aspected_houses("Sun", 1) == {7}
    assert aspected_houses("Mars", 1) == {4, 7, 8}
    assert aspected_houses("Saturn", 10) == {12, 4, 7}


BASE = {"Sun": 10, "Moon": 40, "Mercury": 20, "Jupiter": 100, "Venus": 50, "Saturn": 150, "Rahu": 0.5, "Ketu": 180.5}
NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)


def test_manglik_severity_and_cancellation():
    # Lagna Mesha. Mars in Karka (4th from Lagna) -> Manglik; Jupiter far away.
    d = compute_doshas(_chart(0, {**BASE, "Mars": 95, "Jupiter": 250}), now=NOW)
    assert d.manglik_from_lagna and d.manglik_severity in ("mild", "strong") and d.manglik_cancellations == []
    # Mars in Mesha in the 1st house: own sign -> cancelled.
    d = compute_doshas(_chart(0, {**BASE, "Mars": 5, "Jupiter": 250}), now=NOW)
    assert d.manglik_severity == "cancelled" and "mars_strong_sign" in d.manglik_cancellations
    # Jupiter in the same sign as Mars.
    d = compute_doshas(_chart(0, {**BASE, "Mars": 95, "Jupiter": 100}), now=NOW)
    assert "jupiter_with_mars" in d.manglik_cancellations


def test_kaal_sarp_type_and_pitra():
    # Rahu in the 1st house (Lagna Mesha), every planet on one side -> Anant.
    d = compute_doshas(_chart(0, {**BASE, "Mars": 170}), now=NOW)
    assert d.kaal_sarp and d.kaal_sarp_type == "Anant"
    # Sun with Rahu (both in Mesha) -> Pitra.
    assert d.pitra and "sun_rahu" in d.pitra_reasons
    d = compute_doshas(_chart(0, {**BASE, "Sun": 70, "Mars": 170}), now=NOW)
    assert not d.pitra


def test_sade_sati_periods_last_about_seven_years():
    birth = datetime(1995, 8, 20, tzinfo=timezone.utc)
    periods = sade_sati_periods(1, birth, years=60)  # Moon in Vrishabha
    assert len(periods) == 2
    for p in periods:
        assert 6.5 < (p.end - p.start).days / 365.25 < 8
    assert periods[1].start.year - periods[0].start.year in (29, 30)


def test_avakhada():
    d1 = build_d1_chart(ephemeris.julian_day_ut(datetime(1995, 8, 20, 9, 0, tzinfo=timezone.utc)), 28.61, 77.21)
    a = compute_avakhada(d1)
    assert a.gana in {"Deva", "Manushya", "Rakshasa"} and a.nadi in {"Adi", "Madhya", "Antya"}
    assert a.tatva in {"Fire", "Earth", "Air", "Water"}
