"""
Agent Dispatcher — Intent-based Message Routing

Classifies user message intents and routes them to the appropriate
handler or service. Currently provides keyword-based intent detection
with plans for LLM-based classification in future iterations.

Intent categories:
  - GREETING: Hello, hi, hey, good morning, etc.
  - APPOINTMENT_BOOKING: Book, schedule, appointment, etc.
  - DOCTOR_INQUIRY: Doctor, specialist, who treats, etc.
  - DEPARTMENT_INFO: Department, ward, where is, etc.
  - SYMPTOM_TRIAGE: Symptom descriptions, pain, fever, etc.
  - SERVICE_INQUIRY: Services, tests, procedures, costs, etc.
  - GENERAL_QUERY: Everything else

Design decisions:
  - Uses keyword matching (O(n) over keywords set) for fast, offline
    classification without requiring an LLM call.
  - Keywords stored as frozen sets for O(1) membership testing.
  - Returns intent + confidence for future threshold-based routing.
"""

import logging
from enum import Enum
from typing import Tuple

logger = logging.getLogger(__name__)


class Intent(str, Enum):
    """Enumeration of recognized user intents."""
    GREETING = "greeting"
    APPOINTMENT_BOOKING = "appointment_booking"
    DOCTOR_INQUIRY = "doctor_inquiry"
    DEPARTMENT_INFO = "department_info"
    SYMPTOM_TRIAGE = "symptom_triage"
    SERVICE_INQUIRY = "service_inquiry"
    GENERAL_QUERY = "general_query"


# ------------------------------------------------------------------ #
#  Keyword Sets — Used for fast O(1) keyword presence detection       #
# ------------------------------------------------------------------ #

_GREETING_KEYWORDS = frozenset({
    "hello", "hi", "hey", "greetings", "good morning", "good afternoon",
    "good evening", "howdy", "namaste", "namaskar",
})

_APPOINTMENT_KEYWORDS = frozenset({
    "appointment", "book", "schedule", "booking", "slot", "available",
    "reschedule", "cancel appointment", "when can i come", "visit",
    "time slot", "reserve",
})

_DOCTOR_KEYWORDS = frozenset({
    "doctor", "dr", "specialist", "surgeon", "physician",
    "who treats", "which doctor", "find doctor", "recommend doctor",
    "consultant", "available doctor",
})

_DEPARTMENT_KEYWORDS = frozenset({
    "department", "ward", "floor", "building", "location",
    "where is", "which department", "section", "unit",
    "cardiology", "orthopedics", "pediatrics", "neurology",
    "dermatology", "ent", "gynecology", "general medicine",
})

_SYMPTOM_KEYWORDS = frozenset({
    "pain", "ache", "fever", "cough", "cold", "headache",
    "nausea", "vomiting", "diarrhea", "rash", "swelling",
    "bleeding", "dizzy", "fatigue", "breathless", "chest pain",
    "stomach", "throat", "injury", "broken", "fracture",
    "symptom", "feeling sick", "unwell", "hurts",
})

_SERVICE_KEYWORDS = frozenset({
    "service", "test", "blood test", "x-ray", "ecg", "scan",
    "ultrasound", "vaccination", "checkup", "health check",
    "cost", "price", "fee", "how much", "procedure", "lab",
})


def classify_intent(message: str) -> Tuple[Intent, float]:
    """
    Classify the intent of a user message using keyword matching.

    Uses a scoring system where each matched keyword contributes to
    the intent's score. The intent with the highest score wins.
    If no keywords match, defaults to GENERAL_QUERY.

    Args:
        message: The user's input message text.

    Returns:
        Tuple of (Intent enum value, confidence score 0.0-1.0).

    Example:
        >>> classify_intent("I have a headache and fever")
        (Intent.SYMPTOM_TRIAGE, 0.85)
    """
    text = message.lower().strip()
    words = set(text.split())

    # Score each intent category
    scores = {
        Intent.GREETING: 0.0,
        Intent.APPOINTMENT_BOOKING: 0.0,
        Intent.DOCTOR_INQUIRY: 0.0,
        Intent.DEPARTMENT_INFO: 0.0,
        Intent.SYMPTOM_TRIAGE: 0.0,
        Intent.SERVICE_INQUIRY: 0.0,
    }

    # Check single-word matches
    for word in words:
        if word in _GREETING_KEYWORDS:
            scores[Intent.GREETING] += 1.0
        if word in _APPOINTMENT_KEYWORDS:
            scores[Intent.APPOINTMENT_BOOKING] += 1.0
        if word in _DOCTOR_KEYWORDS:
            scores[Intent.DOCTOR_INQUIRY] += 1.0
        if word in _DEPARTMENT_KEYWORDS:
            scores[Intent.DEPARTMENT_INFO] += 1.0
        if word in _SYMPTOM_KEYWORDS:
            scores[Intent.SYMPTOM_TRIAGE] += 1.0
        if word in _SERVICE_KEYWORDS:
            scores[Intent.SERVICE_INQUIRY] += 1.0

    # Check multi-word phrase matches (bigrams present in keyword sets)
    for keyword_set, intent in [
        (_GREETING_KEYWORDS, Intent.GREETING),
        (_APPOINTMENT_KEYWORDS, Intent.APPOINTMENT_BOOKING),
        (_DOCTOR_KEYWORDS, Intent.DOCTOR_INQUIRY),
        (_DEPARTMENT_KEYWORDS, Intent.DEPARTMENT_INFO),
        (_SYMPTOM_KEYWORDS, Intent.SYMPTOM_TRIAGE),
        (_SERVICE_KEYWORDS, Intent.SERVICE_INQUIRY),
    ]:
        for phrase in keyword_set:
            if " " in phrase and phrase in text:
                scores[intent] += 1.5  # Phrase matches get higher weight

    # Find the winning intent
    max_intent = Intent.GENERAL_QUERY
    max_score = 0.0

    for intent, score in scores.items():
        if score > max_score:
            max_score = score
            max_intent = intent

    # Normalize confidence to 0.0–1.0 range
    confidence = min(max_score / 3.0, 1.0) if max_score > 0 else 0.0

    logger.debug(f"Intent classified: {max_intent.value} (confidence: {confidence:.2f}) for: '{text[:50]}...'")

    return max_intent, confidence


def get_intent_context(intent: Intent) -> str:
    """
    Returns additional system prompt context based on the detected intent.

    This can be injected into the LLM system prompt to guide the
    AI's response toward the relevant topic.

    Args:
        intent: The classified intent.

    Returns:
        Context string to append to the system prompt.
    """
    context_map = {
        Intent.GREETING: "The user is greeting you. Respond warmly and ask how you can help.",
        Intent.APPOINTMENT_BOOKING: "The user wants to book or manage an appointment. Help them with scheduling.",
        Intent.DOCTOR_INQUIRY: "The user is asking about doctors. Provide information about available doctors and their specializations.",
        Intent.DEPARTMENT_INFO: "The user is asking about hospital departments. Provide department information, locations, and operating hours.",
        Intent.SYMPTOM_TRIAGE: "The user is describing symptoms. Assess the severity and recommend the appropriate department.",
        Intent.SERVICE_INQUIRY: "The user is asking about hospital services. Provide information about available tests, procedures, and costs.",
        Intent.GENERAL_QUERY: "The user has a general question. Provide helpful information about the hospital.",
    }

    return context_map.get(intent, context_map[Intent.GENERAL_QUERY])
