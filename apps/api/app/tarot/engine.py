"""Random draws for a tarot reading."""
import random
from dataclasses import dataclass

from app.tarot.constants import TAROT_DECK, TarotCard

SPREADS = {
    "single": ["Your Card"],
    "three_card": ["Past", "Present", "Future"],
}


@dataclass
class DrawnCard:
    position: str
    card: TarotCard
    is_reversed: bool


def draw_cards(spread: str) -> list[DrawnCard]:
    if spread not in SPREADS:
        raise ValueError(f"Unknown spread '{spread}' — expected one of {list(SPREADS)}")

    positions = SPREADS[spread]
    cards = random.sample(TAROT_DECK, k=len(positions))

    return [
        DrawnCard(position=position, card=card, is_reversed=random.random() < 0.5)
        for position, card in zip(positions, cards)
    ]
