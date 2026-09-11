"""Grounded knowledge base for Signal Guide, including the generated ML report."""

from pathlib import Path
from importlib import import_module
import re

try:
    PdfReader = import_module("pypdf").PdfReader
except ImportError:
    PdfReader = None

KNOWLEDGE_BASE = [
    {
        "title": "What the score means",
        "text": "The Mental Health Signal is an informational score from 0 to 10 based on the habits entered in the check-in. A lower score indicates more reported strain, a middle score suggests a fairly balanced rhythm, and a higher score suggests more supportive habits. It is not a diagnosis, medical advice, or a measure of a person's worth.",
    },
    {
        "title": "How to use the check-in",
        "text": "Open My signal, enter the profile, academic and digital habit, lifestyle, and perceived stress details, then select Read my signal. Answer honestly rather than trying to produce a particular score. Repeat the check-in later to notice changes over time.",
    },
    {
        "title": "Healthy habit reflection",
        "text": "Sleep, screen time, phone unlocks, study hours, physical activity, and perceived stress can help reveal patterns. Focus on one small, realistic change for a week, such as a consistent bedtime, a short walk, or a screen-free pause before sleep. Small changes are more sustainable than trying to change everything at once.",
    },
    {
        "title": "Privacy and data",
        "text": "In this demo, account details and recent reads are stored in the browser localStorage, and the check-in is sent to the configured prediction API. Do not enter sensitive clinical information. A production deployment should use secure backend authentication, encrypted transport, a database, and a clear retention policy.",
    },
    {
        "title": "When to seek support",
        "text": "The app cannot assess safety or provide crisis care. If someone may hurt themselves, feels unsafe, or has an urgent mental health concern, contact local emergency services or a crisis line immediately, tell someone trusted, and contact a qualified mental health professional. The score should never replace human support.",
    },
    {
        "title": "What Signal Guide can answer",
        "text": "Signal Guide can explain the score, check-in steps, habit reflection, privacy in this demo, and general guidance about finding human support. It should say when a question is outside this knowledge base rather than inventing an answer.",
    },
]


def load_ml_report():
    report_path = Path(__file__).with_name("Mental_Health_Signal_ML_Report.pdf")
    if PdfReader is None or not report_path.exists():
        return None
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(report_path)).pages).strip()
    return {"title": "Project ML report", "text": text} if text else None


ML_REPORT = load_ml_report()
if ML_REPORT:
    KNOWLEDGE_BASE.append(ML_REPORT)


STOP_WORDS = {
    "a", "an", "and", "are", "can", "do", "does", "for", "how", "i", "is", "it",
    "me", "my", "of", "on", "the", "this", "to", "what", "when", "where", "why", "you",
}


def _tokens(value: str):
    return {word for word in re.findall(r"[a-z0-9]+", value.lower()) if len(word) > 2 and word not in STOP_WORDS}


def retrieve_context(query: str, limit: int = 3) -> str:
    """Return the highest-overlap knowledge passages for a user question."""
    words = _tokens(query)
    ranked = []
    for item in KNOWLEDGE_BASE:
        title_words = _tokens(item["title"])
        text_words = _tokens(item["text"])
        score = (len(words & title_words) * 4) + len(words & text_words)
        ranked.append((score, item))
    ranked.sort(key=lambda entry: entry[0], reverse=True)
    selected = [item for score, item in ranked[:limit] if score > 0]
    if not selected:
        selected = [KNOWLEDGE_BASE[-1]]
    return "\n\n".join(f"[{item['title']}] {item['text']}" for item in selected)
