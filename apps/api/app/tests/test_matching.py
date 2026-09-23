from app.astro.matching import compute_guna_milan


def test_identical_moon_positions_score_high():
    # Same nakshatra/rashi for both partners: Nadi dosha (same Nadi) will
    # zero out that koota, but everything else should max out.
    result = compute_guna_milan(boy_moon_longitude=10.0, girl_moon_longitude=10.0)
    by_name = {k.name: k for k in result.kootas}
    assert by_name["Varna"].points == 1
    assert by_name["Yoni"].points == 4
    assert by_name["Graha Maitri"].points == 5
    assert by_name["Gana"].points == 6
    assert by_name["Bhakoot"].points == 7  # count=1 -> not a dosha combination
    assert 0 <= result.total_points <= 36


def test_total_never_exceeds_36():
    for boy_lon in (0.0, 47.0, 123.0, 250.0, 340.0):
        for girl_lon in (5.0, 90.0, 190.0, 300.0):
            result = compute_guna_milan(boy_lon, girl_lon)
            assert 0 <= result.total_points <= 36
            assert sum(k.max_points for k in result.kootas) == 36
