"""Full 78-card Tarot deck (traditional Rider-Waite-Smith meanings)."""
from dataclasses import dataclass

SUITS = ["Wands", "Cups", "Swords", "Pentacles"]
MINOR_RANKS = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Page", "Knight", "Queen", "King"]

MAJOR_ARCANA_NAMES = [
    "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
    "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
    "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
    "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
]


@dataclass
class TarotCard:
    name: str
    arcana: str  # "major" | "minor"
    suit: str | None
    rank: str
    keywords: list[str]
    upright_meaning: str
    reversed_meaning: str


_MAJOR_MEANINGS: list[tuple[list[str], str, str]] = [
    (["new beginnings", "innocence", "spontaneity"], "A leap of faith into something new, free of fear or judgment.", "Recklessness, naivety, or a fear of moving forward."),
    (["manifestation", "resourcefulness", "power"], "You have all the tools you need to manifest your intentions.", "Manipulation, poor planning, or untapped talent."),
    (["intuition", "mystery", "subconscious"], "Trust your inner voice and the wisdom beneath the surface.", "Secrets withheld, disconnection from intuition."),
    (["abundance", "nurturing", "fertility"], "Growth, abundance, and nurturing energy surround you.", "Creative block, dependence, or neglect."),
    (["authority", "structure", "stability"], "Structure, discipline, and a strong foundation lead to success.", "Rigidity, control issues, or lack of discipline."),
    (["tradition", "conformity", "institutions"], "Guidance from tradition, mentorship, or established systems.", "Rebellion against convention, or restrictive dogma."),
    (["partnership", "choice", "alignment"], "A meaningful union or a values-driven choice.", "Disharmony, misalignment, or a difficult choice avoided."),
    (["willpower", "determination", "victory"], "Determination and focus drive you to victory.", "Lack of direction, aggression, or loss of control."),
    (["courage", "patience", "compassion"], "Quiet inner strength and compassion overcome the odds.", "Self-doubt, weakness, or a lack of self-control."),
    (["introspection", "solitude", "guidance"], "A time for solitary reflection brings inner wisdom.", "Isolation, loneliness, or withdrawal for the wrong reasons."),
    (["cycles", "fate", "turning points"], "A turning point — change is coming, driven by fate.", "Bad luck, resistance to change, or a cycle repeating."),
    (["fairness", "truth", "cause and effect"], "Fairness and truth prevail; actions have clear consequences.", "Unfairness, dishonesty, or an unresolved situation."),
    (["surrender", "new perspective", "pause"], "Pause and see the situation from a new angle.", "Stalling, resistance to letting go, or delays."),
    (["endings", "transition", "transformation"], "An ending clears the way for necessary transformation.", "Resistance to change, or a transition left incomplete."),
    (["balance", "moderation", "patience"], "Patience and balance bring harmony to opposing forces.", "Imbalance, excess, or impatience."),
    (["bondage", "materialism", "temptation"], "Attachment, temptation, or a feeling of being trapped.", "Breaking free from limitations or unhealthy patterns."),
    (["sudden change", "upheaval", "revelation"], "A sudden, disruptive change reveals an uncomfortable truth.", "Averted disaster, or fear of necessary change."),
    (["hope", "faith", "renewal"], "Hope and renewal after a difficult period.", "Despair, self-doubt, or disconnection from hope."),
    (["illusion", "fear", "subconscious"], "Uncertainty and hidden emotions ask you to trust intuition over fear.", "Confusion clearing, or fear that was never real."),
    (["joy", "success", "vitality"], "Joy, success, and vitality shine through clearly.", "Temporary sadness, or success delayed but not denied."),
    (["reckoning", "awakening", "renewal"], "A moment of reckoning brings clarity and a fresh start.", "Self-doubt, or avoidance of an important decision."),
    (["completion", "integration", "accomplishment"], "Completion — a cycle closes with a sense of accomplishment.", "Incompletion, or a goal just out of reach."),
]

_MINOR_MEANINGS: dict[str, dict[str, tuple[list[str], str, str]]] = {
    "Wands": {
        "Ace": (["inspiration", "new venture", "potential"], "A spark of inspiration ignites a new venture.", "Delays, lack of motivation, or a false start."),
        "2": (["planning", "decisions", "discovery"], "Planning your next move and weighing your options.", "Fear of the unknown, or indecision holding you back."),
        "3": (["expansion", "foresight", "progress"], "Your plans are underway and expansion is on the horizon.", "Delays or obstacles slowing your progress."),
        "4": (["celebration", "homecoming", "stability"], "A joyful celebration or milestone worth marking.", "Instability at home, or a canceled celebration."),
        "5": (["conflict", "competition", "tension"], "Competing viewpoints create friction, but also growth.", "Avoided conflict, or infighting that drains energy."),
        "6": (["victory", "recognition", "pride"], "Public recognition and a well-earned victory.", "Delayed recognition, or fear of failure."),
        "7": (["defense", "perseverance", "standing ground"], "Standing your ground against opposition.", "Feeling overwhelmed, or giving up the fight too soon."),
        "8": (["speed", "movement", "alignment"], "Rapid movement — events accelerate toward resolution.", "Delays, frustration, or things moving too fast."),
        "9": (["resilience", "persistence", "boundaries"], "Resilience carries you through one last challenge.", "Burnout, defensiveness, or exhaustion."),
        "10": (["burden", "responsibility", "overwhelm"], "Carrying a heavy load of responsibility toward the goal.", "Release of a burden, or feeling overwhelmed to breaking point."),
        "Page": (["exploration", "enthusiasm", "free spirit"], "An enthusiastic message or the start of an adventurous idea.", "Impulsiveness, or a lack of direction."),
        "Knight": (["energy", "passion", "impulsiveness"], "Bold, energetic action driven by passion.", "Recklessness, or a plan that fizzles out."),
        "Queen": (["confidence", "determination", "warmth"], "Confident, warm, and independent energy.", "Jealousy, insecurity, or demanding attention."),
        "King": (["leadership", "vision", "boldness"], "Bold visionary leadership and entrepreneurial spirit.", "Impulsivity, or overbearing ambition."),
    },
    "Cups": {
        "Ace": (["new love", "compassion", "emotional beginning"], "An overflow of love, compassion, or emotional new beginnings.", "Emotional blockage, or a love that's one-sided."),
        "2": (["partnership", "connection", "mutual attraction"], "A deep mutual connection or partnership forms.", "Imbalance in a relationship, or a broken connection."),
        "3": (["friendship", "celebration", "community"], "Joyful celebration shared with friends and community.", "Overindulgence, or gossip straining friendships."),
        "4": (["apathy", "contemplation", "missed opportunity"], "Discontent or boredom blinds you to an opportunity in front of you.", "Renewed interest, or motivation returning."),
        "5": (["loss", "grief", "regret"], "Grief over a loss, while overlooking what remains.", "Acceptance, forgiveness, and moving forward."),
        "6": (["nostalgia", "memories", "reunion"], "Nostalgia and sweet memories, or a reunion from the past.", "Living in the past, or an unhealthy attachment to it."),
        "7": (["choices", "illusion", "fantasy"], "Many tempting options, not all of them real or wise.", "Clarity after confusion, or a hard choice finally made."),
        "8": (["walking away", "seeking", "disillusionment"], "Walking away from something unfulfilling in search of deeper meaning.", "Fear of change, or aimless wandering."),
        "9": (["contentment", "satisfaction", "gratitude"], "Satisfaction and emotional fulfillment — a wish granted.", "Overindulgence, or emptiness despite outward success."),
        "10": (["harmony", "fulfillment", "family"], "Lasting happiness, harmony, and emotional fulfillment, often with family.", "Disconnection at home, or unrealistic ideals of happiness."),
        "Page": (["creativity", "intuition", "curiosity"], "A creative or emotional message; openness to intuition.", "Emotional immaturity, or blocked creativity."),
        "Knight": (["romance", "charm", "idealism"], "A romantic offer or an idealistic pursuit of the heart.", "Unrealistic expectations, or moodiness."),
        "Queen": (["compassion", "empathy", "emotional security"], "Deep compassion and emotional intuition guide you.", "Emotional overwhelm, or codependency."),
        "King": (["emotional balance", "diplomacy", "control"], "Calm emotional mastery and diplomatic wisdom.", "Moodiness, or emotional manipulation."),
    },
    "Swords": {
        "Ace": (["clarity", "breakthrough", "truth"], "A breakthrough moment of mental clarity and truth.", "Confusion, miscommunication, or a chaotic idea."),
        "2": (["stalemate", "indecision", "difficult choice"], "A difficult decision met with avoidance or blocked emotion.", "Indecision resolved, or information finally coming to light."),
        "3": (["heartbreak", "sorrow", "grief"], "Painful heartbreak or a truth that hurts.", "Healing from heartbreak, or releasing old pain."),
        "4": (["rest", "recovery", "contemplation"], "A necessary rest to recover and recharge.", "Burnout from refusing to pause, or restlessness."),
        "5": (["conflict", "defeat", "win at all costs"], "A hollow victory, or conflict that costs more than it wins.", "Reconciliation, or the fallout of a bitter conflict."),
        "6": (["transition", "moving on", "release"], "Moving away from turmoil toward calmer waters.", "Resistance to moving on, or unfinished business."),
        "7": (["deception", "strategy", "getting away with something"], "A strategic, possibly deceptive move to get ahead.", "A deception coming to light, or a guilty conscience."),
        "8": (["restriction", "self-imposed limits", "fear"], "Feeling trapped by circumstances or self-imposed limitations.", "Breaking free of limiting beliefs."),
        "9": (["anxiety", "worry", "nightmares"], "Anxiety and worry, often worse in the mind than reality.", "Relief after anxiety, or hope after despair."),
        "10": (["painful ending", "betrayal", "rock bottom"], "A painful ending, but also the certainty that it can't get worse.", "Recovery beginning, or resisting an inevitable end."),
        "Page": (["curiosity", "vigilance", "new ideas"], "A curious, sharp mind eager to learn and question.", "Gossip, all-talk-no-action, or scattered thinking."),
        "Knight": (["ambition", "action", "directness"], "Fast, direct, and ambitious pursuit of a goal.", "Recklessness, or aggression without direction."),
        "Queen": (["clarity", "independence", "honesty"], "Sharp, honest clarity and independent thinking.", "Coldness, or being overly critical."),
        "King": (["authority", "truth", "intellect"], "Clear-headed authority grounded in truth and logic.", "Abuse of power, or manipulative logic."),
    },
    "Pentacles": {
        "Ace": (["new opportunity", "prosperity", "manifestation"], "A new opportunity for material or financial growth.", "A missed opportunity, or poor financial planning."),
        "2": (["balance", "adaptability", "juggling priorities"], "Juggling multiple priorities with adaptability.", "Overwhelm from too many commitments, or disorganization."),
        "3": (["teamwork", "collaboration", "skill"], "Collaborative work and shared skill build something lasting.", "Lack of teamwork, or mediocre effort."),
        "4": (["security", "control", "saving"], "Holding tightly to security and material control.", "Letting go of control, or fear of loss driving greed."),
        "5": (["hardship", "isolation", "financial loss"], "A period of hardship or feeling left out in the cold.", "Recovery from hardship, or finding support at last."),
        "6": (["generosity", "charity", "giving and receiving"], "Generosity flows — giving or receiving support fairly.", "An imbalance of power in giving, or strings attached."),
        "7": (["patience", "investment", "long-term view"], "Patiently assessing the results of long-term effort.", "Impatience, or wasted effort on the wrong investment."),
        "8": (["mastery", "diligence", "craftsmanship"], "Diligent, focused work toward mastering a craft.", "Sloppy work, or a lack of focus and motivation."),
        "9": (["abundance", "self-sufficiency", "luxury"], "Self-sufficient abundance, enjoyed on your own terms.", "Overextension, or reliance on others for security."),
        "10": (["legacy", "wealth", "family"], "Lasting wealth, legacy, and long-term security, often family-related.", "Financial loss, or family conflict over resources."),
        "Page": (["ambition", "diligence", "new skill"], "A studious new pursuit of a practical goal or skill.", "Procrastination, or unrealistic goals."),
        "Knight": (["reliability", "hard work", "routine"], "Steady, reliable, methodical progress.", "Stagnation, or boredom with routine."),
        "Queen": (["nurturing", "practicality", "resourcefulness"], "Practical nurturing — creating comfort and abundance for others.", "Self-neglect, or smothering others."),
        "King": (["abundance", "security", "business acumen"], "Steady, generous mastery of material and financial security.", "Greed, stubbornness, or being overly materialistic."),
    },
}


def _build_deck() -> list[TarotCard]:
    deck: list[TarotCard] = []
    for i, name in enumerate(MAJOR_ARCANA_NAMES):
        keywords, upright, reversed_ = _MAJOR_MEANINGS[i]
        deck.append(TarotCard(name=name, arcana="major", suit=None, rank=str(i), keywords=keywords, upright_meaning=upright, reversed_meaning=reversed_))

    for suit in SUITS:
        for rank in MINOR_RANKS:
            keywords, upright, reversed_ = _MINOR_MEANINGS[suit][rank]
            name = f"{rank} of {suit}"
            deck.append(TarotCard(name=name, arcana="minor", suit=suit, rank=rank, keywords=keywords, upright_meaning=upright, reversed_meaning=reversed_))

    return deck


TAROT_DECK: list[TarotCard] = _build_deck()
TAROT_DECK_BY_NAME: dict[str, TarotCard] = {c.name: c for c in TAROT_DECK}
