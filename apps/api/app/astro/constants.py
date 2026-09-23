"""Static reference tables used across the astrology engine.

All angles are in decimal degrees, sidereal (Lahiri ayanamsa).
"""

RASHIS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena",
]

RASHI_ENGLISH = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

RASHI_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

# The 9 dasha-lord sequence repeats 3x across the 27 nakshatras.
DASHA_LORD_SEQUENCE = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
]

NAKSHATRA_LORDS = [DASHA_LORD_SEQUENCE[i % 9] for i in range(27)]

# Vimshottari mahadasha lengths in years, total = 120.
VIMSHOTTARI_YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}

PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]

NAKSHATRA_SPAN = 360.0 / 27.0  # 13deg20'
PADA_SPAN = NAKSHATRA_SPAN / 4.0  # 3deg20'

# ---- Ashtakoot (Guna Milan) reference tables ----

VARNA_GROUP = {
    "Karka": "Brahmin", "Vrischika": "Brahmin", "Meena": "Brahmin",
    "Mesha": "Kshatriya", "Simha": "Kshatriya", "Dhanu": "Kshatriya",
    "Vrishabha": "Vaishya", "Kanya": "Vaishya", "Makara": "Vaishya",
    "Mithuna": "Shudra", "Tula": "Shudra", "Kumbha": "Shudra",
}
VARNA_RANK = {"Brahmin": 4, "Kshatriya": 3, "Vaishya": 2, "Shudra": 1}

# Simplified whole-sign Vashya grouping (common software approximation;
# classical texts subdivide some signs by half — refine with a reference
# text before relying on this for paid/production matching reports).
VASHYA_GROUP = {
    "Mesha": "Chatushpada", "Vrishabha": "Chatushpada", "Simha": "Chatushpada",
    "Dhanu": "Chatushpada", "Makara": "Chatushpada",
    "Mithuna": "Manava", "Kanya": "Manava", "Tula": "Manava", "Kumbha": "Manava",
    "Karka": "Jalachara", "Meena": "Jalachara",
    "Vrischika": "Keeta",
}
# Vashya compatibility points (0-2) between groom-group and bride-group.
VASHYA_POINTS = {
    ("Chatushpada", "Chatushpada"): 2, ("Manava", "Manava"): 2,
    ("Jalachara", "Jalachara"): 2, ("Keeta", "Keeta"): 2,
    ("Chatushpada", "Manava"): 1, ("Manava", "Chatushpada"): 1,
    ("Chatushpada", "Jalachara"): 1, ("Jalachara", "Chatushpada"): 1,
    ("Manava", "Jalachara"): 1, ("Jalachara", "Manava"): 1,
}

YONI_ANIMAL = [
    "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog",
    "Cat", "Sheep", "Cat", "Rat", "Cat", "Rat",
    "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
    "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse",
    "Lion", "Cow", "Elephant",
]
# Same animal = 4, natural enemy pair = 0, otherwise 1-3 by affinity group.
YONI_ENEMIES = {
    frozenset({"Cat", "Rat"}), frozenset({"Serpent", "Mongoose"}),
    frozenset({"Dog", "Deer"}), frozenset({"Horse", "Buffalo"}),
    frozenset({"Lion", "Elephant"}), frozenset({"Cow", "Tiger"}),
    frozenset({"Sheep", "Monkey"}),
}

# Rashi-lord friendship table (Naisargika Maitri), used for Graha Maitri koota.
PLANET_FRIENDS = {
    "Sun": {"friends": {"Moon", "Mars", "Jupiter"}, "enemies": {"Venus", "Saturn"}, "neutral": {"Mercury"}},
    "Moon": {"friends": {"Sun", "Mercury"}, "enemies": set(), "neutral": {"Mars", "Jupiter", "Venus", "Saturn"}},
    "Mars": {"friends": {"Sun", "Moon", "Jupiter"}, "enemies": {"Mercury"}, "neutral": {"Venus", "Saturn"}},
    "Mercury": {"friends": {"Sun", "Venus"}, "enemies": {"Moon"}, "neutral": {"Mars", "Jupiter", "Saturn"}},
    "Jupiter": {"friends": {"Sun", "Moon", "Mars"}, "enemies": {"Mercury", "Venus"}, "neutral": {"Saturn"}},
    "Venus": {"friends": {"Mercury", "Saturn"}, "enemies": {"Sun", "Moon"}, "neutral": {"Mars", "Jupiter"}},
    "Saturn": {"friends": {"Mercury", "Venus"}, "enemies": {"Sun", "Moon", "Mars"}, "neutral": {"Jupiter"}},
}

GANA = [
    "Deva", "Manushya", "Rakshasa", "Manushya", "Rakshasa", "Manushya",
    "Deva", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya",
    "Deva", "Deva", "Deva", "Rakshasa", "Deva", "Rakshasa",
    "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa",
    "Manushya", "Manushya", "Deva",
]
GANA_POINTS = {
    ("Deva", "Deva"): 6, ("Manushya", "Manushya"): 6, ("Rakshasa", "Rakshasa"): 6,
    ("Deva", "Manushya"): 5, ("Manushya", "Deva"): 5,
    ("Deva", "Rakshasa"): 0, ("Rakshasa", "Deva"): 0,
    ("Manushya", "Rakshasa"): 1, ("Rakshasa", "Manushya"): 1,
}

NADI = [
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
    "Adi", "Madhya", "Antya",
]
