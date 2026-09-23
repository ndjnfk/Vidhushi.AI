from app.astro.chart import build_d1_chart, build_d9_chart, house_of, navamsa_sign_index, sign_index_of
from app.astro import ephemeris
from datetime import datetime, timezone


def test_sign_index_boundaries():
    assert sign_index_of(0.0) == 0
    assert sign_index_of(29.999) == 0
    assert sign_index_of(30.0) == 1
    assert sign_index_of(359.999) == 11


def test_house_of_wraps_around():
    assert house_of(sign_index=0, asc_sign_index=0) == 1
    assert house_of(sign_index=11, asc_sign_index=0) == 12
    assert house_of(sign_index=0, asc_sign_index=1) == 12


def test_navamsa_movable_sign_starts_same_sign():
    # Aries (movable) 0deg -> navamsa part 0 -> Aries itself
    assert navamsa_sign_index(0.0) == 0


def test_navamsa_fixed_sign_starts_ninth_sign():
    # Taurus (fixed, sign index 1) 0deg -> navamsa starts at Capricorn (index 9)
    assert navamsa_sign_index(30.0) == 9


def test_d1_chart_has_all_planets_and_valid_houses():
    dt = datetime(1990, 6, 15, 10, 30, tzinfo=timezone.utc)
    jd = ephemeris.julian_day_ut(dt)
    chart = build_d1_chart(jd, lat=28.6139, lon=77.2090)

    assert len(chart.planets) == 9
    for p in chart.planets:
        assert 1 <= p.house <= 12
        assert 0 <= p.sign_index <= 11


def test_d9_chart_builds_from_d1():
    dt = datetime(1990, 6, 15, 10, 30, tzinfo=timezone.utc)
    jd = ephemeris.julian_day_ut(dt)
    d1 = build_d1_chart(jd, lat=28.6139, lon=77.2090)
    d9 = build_d9_chart(d1)
    assert len(d9.planets) == len(d1.planets)
