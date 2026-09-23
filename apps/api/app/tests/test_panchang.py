from datetime import date, timedelta

from app.astro.panchang import compute_panchang


def test_panchang_returns_valid_fields():
    result = compute_panchang(date(2024, 1, 1), lat=28.6139, lon=77.2090)  # New Delhi

    assert result.vara in {
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    }
    assert result.tithi_paksha in {"Shukla", "Krishna"}
    assert result.sunrise_utc < result.sunset_utc


def test_vara_matches_known_weekday():
    # 2024-01-01 was a Monday
    result = compute_panchang(date(2024, 1, 1), lat=28.6139, lon=77.2090)
    assert result.vara == "Monday"


def test_sunrise_is_on_the_requested_local_date_for_places_east_of_greenwich():
    # New Delhi is UTC+5:30 — a naive "search from UTC midnight" bug returns
    # the *next* day's sunrise instead of today's. Guard against that.
    result = compute_panchang(date(1990, 6, 15), lat=28.6139, lon=77.2090)
    local_sunrise = result.sunrise_utc + timedelta(hours=5, minutes=30)
    assert local_sunrise.date().isoformat() == "1990-06-15"
    assert 4 <= local_sunrise.hour <= 6  # sanity: June sunrise in Delhi is ~05:20-05:30 IST
