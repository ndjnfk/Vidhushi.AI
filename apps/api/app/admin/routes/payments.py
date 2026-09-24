"""Admin: Vidushi Ji's UPI details and QR image for consultation payments."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.admin.deps import get_current_admin
from app.core.upi import decode_qr_upload, get_upi_settings, qr_data_url
from app.models.models import UpiSettings
from app.schemas.schemas import UpiQrIn, UpiSettingsIn, UpiSettingsOut

router = APIRouter(prefix="/admin/upi", tags=["admin"], dependencies=[Depends(get_current_admin)])


def _out(row: UpiSettings) -> UpiSettingsOut:
    return UpiSettingsOut(
        upi_id=row.upi_id, payee_name=row.payee_name, qr_image=qr_data_url(row),
        updated_at=row.updated_at if row.id else None,
    )


async def _save(row: UpiSettings) -> UpiSettings:
    row.updated_at = datetime.utcnow()
    if row.id:
        await row.save()
    else:
        await row.insert()
    return row


@router.get("", response_model=UpiSettingsOut)
async def get_upi():
    return _out(await get_upi_settings())


@router.put("", response_model=UpiSettingsOut)
async def update_upi(payload: UpiSettingsIn):
    row = await get_upi_settings()
    row.upi_id = payload.upi_id.strip()
    row.payee_name = payload.payee_name.strip()
    return _out(await _save(row))


@router.put("/qr", response_model=UpiSettingsOut)
async def upload_qr(payload: UpiQrIn):
    try:
        raw, content_type = decode_qr_upload(payload.data_url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    row = await get_upi_settings()
    row.qr_image, row.qr_content_type = raw, content_type
    return _out(await _save(row))


@router.delete("/qr", response_model=UpiSettingsOut)
async def delete_qr():
    row = await get_upi_settings()
    row.qr_image, row.qr_content_type = None, ""
    return _out(await _save(row))
