"""UPI payment settings, resolved from the admin-edited UpiSettings row with
the UPI_ID env setting as a fallback."""
import base64
from urllib.parse import quote, urlencode

from app.core.config import get_settings
from app.models.models import UpiSettings

MAX_QR_BYTES = 2 * 1024 * 1024
_ALLOWED = {
    "image/png": b"\x89PNG",
    "image/jpeg": b"\xff\xd8\xff",
    "image/webp": b"RIFF",
}


async def get_upi_settings() -> UpiSettings:
    row = await UpiSettings.find_one()
    if row is None:
        s = get_settings()
        row = UpiSettings(upi_id=s.upi_id or "", payee_name=s.upi_payee_name)
    return row


def upi_uri(upi_id: str, payee: str, amount: float, note: str) -> str:
    """A upi:// link with the amount filled in (rendered as a QR by the site)."""
    q = urlencode({"pa": upi_id, "pn": payee, "am": f"{amount:.2f}", "cu": "INR", "tn": note}, quote_via=quote)
    return f"upi://pay?{q}"


def qr_data_url(row: UpiSettings) -> str | None:
    if not row.qr_image:
        return None
    return f"data:{row.qr_content_type};base64,{base64.b64encode(row.qr_image).decode()}"


def decode_qr_upload(data_url: str) -> tuple[bytes, str]:
    return decode_image_upload(data_url, MAX_QR_BYTES)


def decode_image_upload(data_url: str, max_bytes: int) -> tuple[bytes, str]:
    """Validate an uploaded image sent as a data: URL; return (bytes, type)."""
    if not data_url.startswith("data:") or ";base64," not in data_url:
        raise ValueError("Upload a PNG, JPEG or WebP image")
    header, b64 = data_url.split(";base64,", 1)
    content_type = header[len("data:"):].lower()
    if content_type not in _ALLOWED:
        raise ValueError("Upload a PNG, JPEG or WebP image")
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        raise ValueError("The image could not be read")
    if len(raw) > max_bytes:
        raise ValueError(f"Image is larger than {max_bytes // (1024 * 1024)} MB")
    if not raw.startswith(_ALLOWED[content_type]):
        raise ValueError("The file is not a valid image")
    return raw, content_type
