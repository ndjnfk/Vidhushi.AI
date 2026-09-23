from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user_optional
from app.models.models import DrawnCardEmbedded, TarotReading, User
from app.schemas.schemas import (
    DrawnCardOut,
    TarotCardMeaningOut,
    TarotReadingCreate,
    TarotReadingOut,
)
from app.tarot.constants import TAROT_DECK, TAROT_DECK_BY_NAME
from app.tarot.engine import SPREADS, draw_cards

router = APIRouter(prefix="/tarot", tags=["tarot"])


@router.get("/deck", response_model=list[TarotCardMeaningOut])
async def get_deck():
    return [
        TarotCardMeaningOut(
            name=c.name, arcana=c.arcana, suit=c.suit, rank=c.rank,
            keywords=c.keywords, upright_meaning=c.upright_meaning, reversed_meaning=c.reversed_meaning,
        )
        for c in TAROT_DECK
    ]


def _drawn_card_out(embedded: DrawnCardEmbedded) -> DrawnCardOut:
    card = TAROT_DECK_BY_NAME[embedded.name]
    meaning = card.reversed_meaning if embedded.is_reversed else card.upright_meaning
    return DrawnCardOut(
        position=embedded.position, name=embedded.name, is_reversed=embedded.is_reversed,
        keywords=card.keywords, meaning=meaning,
    )


def _reading_out(reading: TarotReading) -> TarotReadingOut:
    return TarotReadingOut(
        id=str(reading.id), spread=reading.spread, question=reading.question,
        cards=[_drawn_card_out(c) for c in reading.cards], created_at=reading.created_at,
    )


@router.post("/reading", response_model=TarotReadingOut)
async def create_reading(payload: TarotReadingCreate, user: User | None = Depends(get_current_user_optional)):
    if payload.spread not in SPREADS:
        raise HTTPException(status_code=400, detail=f"spread must be one of {list(SPREADS)}")

    drawn = draw_cards(payload.spread)

    reading = TarotReading(
        user_id=str(user.id) if user else None,
        spread=payload.spread,
        question=payload.question,
        cards=[DrawnCardEmbedded(position=d.position, name=d.card.name, is_reversed=d.is_reversed) for d in drawn],
    )
    await reading.insert()

    return _reading_out(reading)


@router.get("/reading/{reading_id}", response_model=TarotReadingOut)
async def get_reading(reading_id: str):
    reading = await TarotReading.get(reading_id)
    if reading is None:
        raise HTTPException(status_code=404, detail="Reading not found")
    return _reading_out(reading)
