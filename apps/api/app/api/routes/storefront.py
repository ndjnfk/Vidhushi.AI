from fastapi import APIRouter, HTTPException, Query

from app.models.models import Vendor
from app.schemas.schemas import StorefrontOut, VendorBrandingIn

router = APIRouter(prefix="/storefront", tags=["storefront"])


def _storefront_out(v: Vendor) -> StorefrontOut:
    return StorefrontOut(
        vendor_id=str(v.id), name=v.name, vendor_type=v.vendor_type, bio=v.bio,
        languages=v.languages, specialties=v.specialties, experience_years=v.experience_years,
        rate_per_session=v.rate_per_session, rating=v.rating,
        storefront_slug=v.storefront_slug, custom_domain=v.custom_domain,
        branding=VendorBrandingIn(**v.branding.model_dump()),
    )


@router.get("/resolve", response_model=StorefrontOut)
async def resolve_storefront(host: str = Query(...)):
    """Given a request Host header, find the white-label vendor site it maps
    to (if any) — used by the frontend's middleware to decide whether to
    render the default site or a vendor's branded storefront."""
    hostname = host.split(":")[0].lower()  # strip a port, if present
    vendor = await Vendor.find_one({
        "custom_domain": hostname, "is_white_label_enabled": True, "status": "active",
    })
    if vendor is None:
        raise HTTPException(status_code=404, detail="No storefront for this host")
    return _storefront_out(vendor)


@router.get("/{slug}", response_model=StorefrontOut)
async def get_storefront_by_slug(slug: str):
    vendor = await Vendor.find_one({
        "storefront_slug": slug, "is_white_label_enabled": True, "status": "active",
    })
    if vendor is None:
        raise HTTPException(status_code=404, detail="Storefront not found")
    return _storefront_out(vendor)
