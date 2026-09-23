from fastapi import APIRouter, HTTPException

from app.models.models import Vendor
from app.schemas.schemas import VendorOut

router = APIRouter(prefix="/astrologers", tags=["astrologers"])


def _out(v: Vendor) -> VendorOut:
    return VendorOut(
        id=str(v.id), name=v.name, vendor_type=v.vendor_type, bio=v.bio,
        languages=v.languages, specialties=v.specialties, experience_years=v.experience_years,
        rate_per_session=v.rate_per_session, is_online=v.is_online, rating=v.rating,
    )


@router.get("", response_model=list[VendorOut])
async def list_astrologers():
    vendors = await Vendor.find({"vendor_type": "astrologer", "status": "active"}).to_list()
    return [_out(v) for v in vendors]


@router.get("/{vendor_id}", response_model=VendorOut)
async def get_astrologer(vendor_id: str):
    vendor = await Vendor.get(vendor_id)
    if vendor is None or vendor.vendor_type != "astrologer" or vendor.status != "active":
        raise HTTPException(status_code=404, detail="Astrologer not found")
    return _out(vendor)
