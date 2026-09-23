"""Ashtakoot Guna Milan — 8-factor compatibility scoring out of 36.

Inputs are each partner's Moon sidereal longitude at birth; everything
(rashi, nakshatra, nakshatra lord) is derived from that single value.
"""
from dataclasses import dataclass

from app.astro.chart import nakshatra_of, sign_index_of
from app.astro.constants import (
    GANA,
    GANA_POINTS,
    NADI,
    NAKSHATRAS,
    PLANET_FRIENDS,
    RASHIS,
    RASHI_LORDS,
    VARNA_GROUP,
    VARNA_RANK,
    VASHYA_GROUP,
    VASHYA_POINTS,
    YONI_ANIMAL,
    YONI_ENEMIES,
)

MAX_POINTS = {
    "Varna": 1, "Vashya": 2, "Tara": 3, "Yoni": 4,
    "Graha Maitri": 5, "Gana": 6, "Bhakoot": 7, "Nadi": 8,
}

TARA_GOOD_POSITIONS = {2, 4, 6, 8, 9}  # 1-indexed tara number within a 1-9 cycle
BHAKOOT_BAD_COUNTS = {2, 5, 6, 8, 9, 12}


@dataclass
class KootaResult:
    name: str
    points: float
    max_points: int
    note: str = ""


@dataclass
class GunaMilanResult:
    kootas: list[KootaResult]
    total_points: float
    max_points: int


def _varna(boy_rashi: str, girl_rashi: str) -> KootaResult:
    boy_varna = VARNA_GROUP[boy_rashi]
    girl_varna = VARNA_GROUP[girl_rashi]
    points = 1 if VARNA_RANK[boy_varna] >= VARNA_RANK[girl_varna] else 0
    return KootaResult("Varna", points, MAX_POINTS["Varna"], f"{boy_varna} / {girl_varna}")


def _vashya(boy_rashi: str, girl_rashi: str) -> KootaResult:
    boy_group = VASHYA_GROUP.get(boy_rashi, "Manava")
    girl_group = VASHYA_GROUP.get(girl_rashi, "Manava")
    points = VASHYA_POINTS.get((boy_group, girl_group), 0)
    return KootaResult("Vashya", points, MAX_POINTS["Vashya"], f"{boy_group} / {girl_group}")


def _tara(boy_nak_index: int, girl_nak_index: int) -> KootaResult:
    def direction_points(from_idx: int, to_idx: int) -> float:
        count = ((to_idx - from_idx) % 27) + 1
        tara_number = ((count - 1) % 9) + 1
        return 1.5 if tara_number in TARA_GOOD_POSITIONS else 0.0

    points = direction_points(boy_nak_index, girl_nak_index) + direction_points(girl_nak_index, boy_nak_index)
    return KootaResult("Tara", points, MAX_POINTS["Tara"])


def _yoni(boy_nak_index: int, girl_nak_index: int) -> KootaResult:
    boy_animal = YONI_ANIMAL[boy_nak_index]
    girl_animal = YONI_ANIMAL[girl_nak_index]
    if boy_animal == girl_animal:
        points = 4
    elif frozenset({boy_animal, girl_animal}) in YONI_ENEMIES:
        points = 0
    else:
        points = 2  # neutral/compatible pairing (not identical, not enemies)
    return KootaResult("Yoni", points, MAX_POINTS["Yoni"], f"{boy_animal} / {girl_animal}")


def _graha_maitri(boy_rashi: str, girl_rashi: str) -> KootaResult:
    boy_lord = RASHI_LORDS[RASHIS.index(boy_rashi)]
    girl_lord = RASHI_LORDS[RASHIS.index(girl_rashi)]
    if boy_lord == girl_lord:
        points = 5
    elif girl_lord in PLANET_FRIENDS[boy_lord]["friends"] and boy_lord in PLANET_FRIENDS[girl_lord]["friends"]:
        points = 5
    elif girl_lord in PLANET_FRIENDS[boy_lord]["enemies"] and boy_lord in PLANET_FRIENDS[girl_lord]["enemies"]:
        points = 0
    elif girl_lord in PLANET_FRIENDS[boy_lord]["friends"] or boy_lord in PLANET_FRIENDS[girl_lord]["friends"]:
        points = 4
    elif girl_lord in PLANET_FRIENDS[boy_lord]["enemies"] or boy_lord in PLANET_FRIENDS[girl_lord]["enemies"]:
        points = 1
    else:
        points = 3  # neutral both ways
    return KootaResult("Graha Maitri", points, MAX_POINTS["Graha Maitri"], f"{boy_lord} / {girl_lord}")


def _gana(boy_nak_index: int, girl_nak_index: int) -> KootaResult:
    boy_gana = GANA[boy_nak_index]
    girl_gana = GANA[girl_nak_index]
    points = GANA_POINTS[(boy_gana, girl_gana)]
    return KootaResult("Gana", points, MAX_POINTS["Gana"], f"{boy_gana} / {girl_gana}")


def _bhakoot(boy_rashi: str, girl_rashi: str) -> KootaResult:
    boy_idx = RASHIS.index(boy_rashi)
    girl_idx = RASHIS.index(girl_rashi)
    count = ((girl_idx - boy_idx) % 12) + 1
    points = 0 if count in BHAKOOT_BAD_COUNTS else 7
    return KootaResult("Bhakoot", points, MAX_POINTS["Bhakoot"])


def _nadi(boy_nak_index: int, girl_nak_index: int) -> KootaResult:
    boy_nadi = NADI[boy_nak_index]
    girl_nadi = NADI[girl_nak_index]
    points = 0 if boy_nadi == girl_nadi else 8
    return KootaResult("Nadi", points, MAX_POINTS["Nadi"], f"{boy_nadi} / {girl_nadi}")


def compute_guna_milan(boy_moon_longitude: float, girl_moon_longitude: float) -> GunaMilanResult:
    boy_rashi = RASHIS[sign_index_of(boy_moon_longitude)]
    girl_rashi = RASHIS[sign_index_of(girl_moon_longitude)]
    boy_nak, _lord, _pada = nakshatra_of(boy_moon_longitude)
    girl_nak, _lord2, _pada2 = nakshatra_of(girl_moon_longitude)
    boy_nak_idx = NAKSHATRAS.index(boy_nak)
    girl_nak_idx = NAKSHATRAS.index(girl_nak)

    kootas = [
        _varna(boy_rashi, girl_rashi),
        _vashya(boy_rashi, girl_rashi),
        _tara(boy_nak_idx, girl_nak_idx),
        _yoni(boy_nak_idx, girl_nak_idx),
        _graha_maitri(boy_rashi, girl_rashi),
        _gana(boy_nak_idx, girl_nak_idx),
        _bhakoot(boy_rashi, girl_rashi),
        _nadi(boy_nak_idx, girl_nak_idx),
    ]
    total = sum(k.points for k in kootas)
    return GunaMilanResult(kootas=kootas, total_points=total, max_points=36)
