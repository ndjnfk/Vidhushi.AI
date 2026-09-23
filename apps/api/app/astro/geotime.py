"""Resolve a birth place + local date/time into a UTC datetime for the ephemeris."""
from datetime import datetime

import pytz
from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()


def resolve_timezone(lat: float, lon: float) -> str:
    tz_name = _tf.timezone_at(lat=lat, lng=lon)
    if tz_name is None:
        tz_name = _tf.closest_timezone_at(lat=lat, lng=lon)
    if tz_name is None:
        raise ValueError(f"Could not resolve timezone for lat={lat}, lon={lon}")
    return tz_name


def to_utc(local_dt: datetime, lat: float, lon: float) -> datetime:
    """Attach the correct local timezone (by place) to a naive datetime, then convert to UTC."""
    if local_dt.tzinfo is not None:
        raise ValueError("local_dt must be naive (timezone is derived from lat/lon)")
    tz_name = resolve_timezone(lat, lon)
    tz = pytz.timezone(tz_name)
    localized = tz.localize(local_dt)
    return localized.astimezone(pytz.utc)
