"""Seed the shop with the starter bracelet collection.

Idempotent: products are matched by name, so re-running only fills in what's
missing and never duplicates or overwrites admin edits.

    python -m app.scripts.seed_bracelets
"""
import asyncio

from app.core.db import init_db
from app.models.models import Product

BRACELETS = [
    ("Rudraksha Bracelet", "rudraksha", 899, 1299,
     "Energised 5 Mukhi rudraksha beads on a stretch cord, for calm focus and protection."),
    ("Tiger Eye Bracelet", "tiger-eye", 749, None,
     "Golden tiger eye beads to build confidence, courage and steady decision-making."),
    ("Amethyst Bracelet", "amethyst", 999, 1399,
     "Soothing purple amethyst for peace of mind, restful sleep and spiritual clarity."),
    ("Rose Quartz Bracelet", "rose-quartz", 799, None,
     "Soft pink rose quartz, the stone of love — for self-care, harmony and healing."),
    ("Black Tourmaline Bracelet", "black-tourmaline", 849, None,
     "Grounding black tourmaline that shields against negativity and stress."),
    ("7 Chakra Bracelet", "seven-chakra", 699, 999,
     "Seven healing stones, one for each chakra, to balance your body's energy."),
    ("Citrine Bracelet", "citrine", 1099, None,
     "Sunny citrine to attract abundance, positivity and success."),
    ("Pyrite Bracelet", "pyrite", 1199, 1599,
     "Metallic pyrite, the money stone — for prosperity and business growth."),
]


async def main() -> None:
    await init_db()
    added = 0
    for name, slug, price, compare_at, description in BRACELETS:
        if await Product.find_one(Product.name == name):
            continue
        await Product(
            name=name,
            description=description,
            price=price,
            compare_at_price=compare_at,
            image_url=f"/shop/bracelets/{slug}.svg",
            category="bracelet",
            stock_quantity=25,
        ).insert()
        added += 1
    print(f"Added {added} bracelet(s); {len(BRACELETS) - added} already existed.")


if __name__ == "__main__":
    asyncio.run(main())
