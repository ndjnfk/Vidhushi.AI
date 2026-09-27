"""Security questions for "Forgot password". The site shows them translated;
the API stores only the key. Answers are compared after normalising (case,
spaces), and stored hashed like passwords."""
from app.core.security import hash_password, verify_password

QUESTIONS = {
    "first_pet": "What was the name of your first pet?",
    "first_school": "What was the name of your first school?",
    "birth_city": "In which city were you born?",
    "mother_maiden": "What is your mother's maiden name?",
    "favourite_teacher": "What was the name of your favourite teacher?",
    "childhood_friend": "What is the name of your childhood best friend?",
}
QUESTION_PATTERN = "^(" + "|".join(QUESTIONS) + ")$"

MAX_FAILURES = 5  # wrong answers before resets are locked for a while
LOCK_MINUTES = 15


def normalise(answer: str) -> str:
    return " ".join(answer.lower().split())


def hash_answer(answer: str) -> str:
    return hash_password(normalise(answer))


def answer_matches(answer: str, hashed: str) -> bool:
    return bool(hashed) and verify_password(normalise(answer), hashed)
