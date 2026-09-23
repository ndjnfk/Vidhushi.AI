from datetime import datetime, timezone

from app.astro.constants import VIMSHOTTARI_YEARS
from app.astro.dasha import compute_vimshottari


def test_total_dasha_years_sum_to_120_over_full_cycle():
    total_years = sum(VIMSHOTTARI_YEARS.values())
    assert total_years == 120


def test_first_mahadasha_lord_matches_nakshatra_start():
    birth = datetime(2000, 1, 1, tzinfo=timezone.utc)
    # 0deg Moon longitude = start of Ashwini nakshatra -> Ketu dasha, full 7 years
    periods = compute_vimshottari(moon_longitude=0.0, birth_utc=birth, cycles=1)
    assert periods[0].lord == "Ketu"
    elapsed_days = (periods[0].end - periods[0].start).days
    assert abs(elapsed_days - round(7 * 365.2425)) <= 1


def test_mahadashas_are_contiguous():
    birth = datetime(2000, 1, 1, tzinfo=timezone.utc)
    periods = compute_vimshottari(moon_longitude=123.45, birth_utc=birth, cycles=5)
    for prev, nxt in zip(periods, periods[1:]):
        assert prev.end == nxt.start


def test_antardashas_sum_to_mahadasha_span():
    birth = datetime(2000, 1, 1, tzinfo=timezone.utc)
    periods = compute_vimshottari(moon_longitude=45.0, birth_utc=birth, cycles=1)
    maha = periods[0]
    assert maha.antardashas[0].start == maha.start
    assert maha.antardashas[-1].end == maha.end
