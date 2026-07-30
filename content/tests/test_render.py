from pathlib import Path
import pytest
from src.render import render_html, render_item

def test_render_html_tarjeta_incluye_contenido():
    html = render_html("tarjeta", {
        "titulo": "Título de prueba", "bullets": ["uno", "dos", "tres"],
        "fuente": "CONSAR", "kicker": "AFORE POR DESEMPLEO",
    })
    assert "Título de prueba" in html and "uno" in html
    assert "gratuito" in html.lower()  # disclaimer fijo en la plantilla

def test_render_html_escapa_html_del_llm():
    html = render_html("tarjeta", {
        "titulo": "<script>alert(1)</script>", "bullets": ["uno"],
        "fuente": "CONSAR", "kicker": "AFORE POR DESEMPLEO",
    })
    assert "&lt;script&gt;" in html
    assert "<script>alert(1)</script>" not in html

@pytest.mark.slow
def test_render_item_produce_png(tmp_path):
    copy = {"titulo": "T", "bullets": ["a", "b", "c"], "captions": {}, "laminas": []}
    item = {"tema": "requisitos", "formato": "sabias_que", "plantilla": "tarjeta"}
    paths = render_item(item, copy, tmp_path)
    assert len(paths) == 1 and paths[0].stat().st_size > 10_000

@pytest.mark.slow
def test_render_item_carrusel_5_laminas(tmp_path):
    lam = [{"titulo": f"L{i}", "bullets": ["x"]} for i in range(5)]
    copy = {"titulo": "T", "bullets": [], "captions": {}, "laminas": lam}
    item = {"tema": "modalidad_ab", "formato": "carrusel", "plantilla": "lamina"}
    assert len(render_item(item, copy, tmp_path)) == 5
