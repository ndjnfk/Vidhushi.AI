from app.tarot.constants import TAROT_DECK
from app.tarot.engine import draw_cards


def test_deck_has_78_unique_cards():
    assert len(TAROT_DECK) == 78
    assert len({c.name for c in TAROT_DECK}) == 78


def test_deck_has_22_major_and_56_minor():
    majors = [c for c in TAROT_DECK if c.arcana == "major"]
    minors = [c for c in TAROT_DECK if c.arcana == "minor"]
    assert len(majors) == 22
    assert len(minors) == 56


def test_every_card_has_meanings_and_keywords():
    for c in TAROT_DECK:
        assert c.upright_meaning
        assert c.reversed_meaning
        assert len(c.keywords) >= 1


def test_single_spread_draws_one_card():
    drawn = draw_cards("single")
    assert len(drawn) == 1
    assert drawn[0].position == "Your Card"


def test_three_card_spread_draws_three_distinct_cards():
    drawn = draw_cards("three_card")
    assert len(drawn) == 3
    assert [d.position for d in drawn] == ["Past", "Present", "Future"]
    assert len({d.card.name for d in drawn}) == 3  # no duplicates in one reading


def test_orientation_is_randomized_over_many_draws():
    orientations = {draw_cards("single")[0].is_reversed for _ in range(50)}
    assert orientations == {True, False}


def test_unknown_spread_raises():
    import pytest

    with pytest.raises(ValueError):
        draw_cards("celtic_cross")
