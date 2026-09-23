from datetime import datetime, timezone

from app.astro import ephemeris


def test_julian_day_known_value():
    # 2000-01-01 12:00 UTC -> JD 2451545.0 (a standard reference epoch)
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    jd = ephemeris.julian_day_ut(dt)
    assert abs(jd - 2451545.0) < 1e-6


def test_planet_positions_are_in_valid_range():
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    jd = ephemeris.julian_day_ut(dt)
    positions = ephemeris.planet_positions(jd)

    assert set(positions.keys()) == {
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
    }
    for pos in positions.values():
        assert 0.0 <= pos.longitude < 360.0


def test_rahu_ketu_are_opposite():
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    jd = ephemeris.julian_day_ut(dt)
    positions = ephemeris.planet_positions(jd)
    diff = abs((positions["Rahu"].longitude - positions["Ketu"].longitude) % 360.0)
    assert abs(diff - 180.0) < 1e-6


def test_ascendant_in_valid_range():
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    jd = ephemeris.julian_day_ut(dt)
    asc = ephemeris.ascendant_longitude(jd, lat=28.6139, lon=77.2090)  # New Delhi
    assert 0.0 <= asc < 360.0
