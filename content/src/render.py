from __future__ import annotations
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_TPL_DIR = Path(__file__).parent.parent / "templates"
_env = Environment(loader=FileSystemLoader(_TPL_DIR), autoescape=True)

def render_html(plantilla: str, contexto: dict) -> str:
    return _env.get_template(f"{plantilla}.html").render(**contexto)

def _screenshot(html: str, out: Path) -> None:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1350})
        page.set_content(html, wait_until="networkidle")
        page.screenshot(path=str(out))
        browser.close()

def render_item(item: dict, copy: dict, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    base = f"{item['tema']}_{item['formato']}"
    if item["plantilla"] == "lamina":
        paths = []
        total = len(copy["laminas"])
        for n, lam in enumerate(copy["laminas"], start=1):
            html = render_html("lamina", {**lam, "n": n, "total": total})
            out = out_dir / f"{base}_{n}.png"
            _screenshot(html, out)
            paths.append(out)
        return paths
    html = render_html(item["plantilla"], copy)
    out = out_dir / f"{base}.png"
    _screenshot(html, out)
    return [out]
