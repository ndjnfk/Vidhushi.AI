from app.models.models import Vendor, VendorBranding


async def _make_vendor(**overrides) -> Vendor:
    defaults = dict(
        name="Pandit Sharma", vendor_type="astrologer", contact_email="sharma@example.com",
        status="active", rate_per_session=499.0,
    )
    defaults.update(overrides)
    vendor = Vendor(**defaults)
    await vendor.insert()
    return vendor


async def test_slug_lookup_finds_enabled_active_vendor():
    vendor = await _make_vendor(
        storefront_slug="pandit-sharma", is_white_label_enabled=True,
        branding=VendorBranding(display_name="Pandit Sharma Astrology", primary_color="#123456"),
    )

    found = await Vendor.find_one({"storefront_slug": "pandit-sharma", "is_white_label_enabled": True, "status": "active"})
    assert found is not None
    assert found.id == vendor.id
    assert found.branding.primary_color == "#123456"


async def test_slug_lookup_excludes_disabled_white_label():
    await _make_vendor(storefront_slug="disabled-vendor", is_white_label_enabled=False)

    found = await Vendor.find_one({"storefront_slug": "disabled-vendor", "is_white_label_enabled": True, "status": "active"})
    assert found is None


async def test_slug_lookup_excludes_suspended_vendor():
    await _make_vendor(storefront_slug="suspended-vendor", is_white_label_enabled=True, status="suspended")

    found = await Vendor.find_one({"storefront_slug": "suspended-vendor", "is_white_label_enabled": True, "status": "active"})
    assert found is None


async def test_custom_domain_lookup():
    await _make_vendor(custom_domain="panditsharma.com", is_white_label_enabled=True)

    found = await Vendor.find_one({"custom_domain": "panditsharma.com", "is_white_label_enabled": True, "status": "active"})
    assert found is not None


async def test_storefront_slug_uniqueness_enforced_by_index():
    await _make_vendor(storefront_slug="dup-slug", contact_email="a@example.com")
    with __import__("pytest").raises(Exception):
        await _make_vendor(storefront_slug="dup-slug", contact_email="b@example.com")


async def test_multiple_vendors_can_have_no_storefront_slug():
    # Sparse unique index must not collide on None/absent values.
    v1 = await _make_vendor(contact_email="a@example.com")
    v2 = await _make_vendor(contact_email="b@example.com")
    assert v1.storefront_slug is None
    assert v2.storefront_slug is None
