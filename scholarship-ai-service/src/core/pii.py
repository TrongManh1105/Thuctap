import re

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE_RE = re.compile(r"(?:\+84|0)\d{8,10}\b")
_NATIONAL_ID_RE = re.compile(r"\b\d{12}\b|\b\d{9}\b")


def redact_pii(text: str) -> str:
    """Loại bỏ thông tin định danh cá nhân nhạy cảm trước khi gửi cho LLM."""
    if not text:
        return ""
    text = _EMAIL_RE.sub("[REDACTED_EMAIL]", text)
    text = _PHONE_RE.sub("[REDACTED_PHONE]", text)
    text = _NATIONAL_ID_RE.sub("[REDACTED_ID]", text)
    return text
