from datetime import date
from src.catalog import FORMATOS, GRUPOS, TEMAS, plan_semana

def test_plan_semana_estructura():
    items = plan_semana(date(2026, 8, 3))  # lunes
    assert len(items) == 8  # 3 fb+ig, 3 grupo, 2 tiktok
    assert sum(1 for i in items if i["channels"] == ["fb_page", "ig"]) == 3
    assert sum(1 for i in items if i["channels"] == ["grupo"]) == 3
    assert sum(1 for i in items if i["channels"] == ["tiktok"]) == 2

def test_grupo_items_llevan_source_valido():
    items = plan_semana(date(2026, 8, 3))
    sources = {g["source"] for g in GRUPOS}
    for i in items:
        if i["channels"] == ["grupo"]:
            assert i["source"] in sources

def test_temas_no_se_repiten_en_la_semana():
    items = plan_semana(date(2026, 8, 3))
    temas = [i["tema"] for i in items]
    assert len(temas) == len(set(temas))

def test_rotacion_cambia_por_semana():
    s1 = [i for i in plan_semana(date(2026, 8, 3)) if i["channels"] == ["grupo"]]
    s2 = [i for i in plan_semana(date(2026, 8, 10)) if i["channels"] == ["grupo"]]
    assert [i["source"] for i in s1] != [i["source"] for i in s2]

def test_catalogo_completo():
    assert len(TEMAS) == 10 and len(FORMATOS) == 8 and len(GRUPOS) == 6
