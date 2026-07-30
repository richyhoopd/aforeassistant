"""Catálogo editorial: qué se publica, dónde y cuándo.

Fuente: docs/marketing/estrategia.md y grupos.md. Determinista por fecha para
que generate.py sea re-ejecutable sin duplicar el plan.
"""
from __future__ import annotations
from datetime import date, datetime, time, timedelta, timezone

TEMAS = [
    {"code": "requisitos", "titulo": "Requisitos del retiro por desempleo (46 días, 3/5 años, una vez cada 5 años)"},
    {"code": "modalidad_ab", "titulo": "Modalidad A vs B explicada con peras y manzanas"},
    {"code": "tramite_gratis", "titulo": "El trámite es GRATIS — cuidado con quien te cobra por hacerlo"},
    {"code": "semanas", "titulo": "Cómo saber cuántas semanas cotizadas tienes (IMSS Digital / AforeWeb)"},
    {"code": "cuando_no", "titulo": "El retiro descuenta semanas: cuándo SÍ conviene y cuándo NO"},
    {"code": "reintegro", "titulo": "Cómo recuperar las semanas descontadas (reintegro)"},
    {"code": "errores", "titulo": "Errores comunes que hacen que rechacen la solicitud"},
    {"code": "que_afore", "titulo": "Qué AFORE tengo y cómo localizarla si no sé"},
    {"code": "mitos", "titulo": "Mitos: es un préstamo, pierdes tu AFORE, solo con abogado"},
    {"code": "checklist_docs", "titulo": "Checklist de documentos antes de ir a tu AFORE"},
]

FORMATOS = ["mito", "checklist", "sabias_que", "caso", "anticoyote", "pregunta", "coyuntura", "carrusel"]

GRUPOS = [
    {"nombre": "Bolsa de Trabajo. México", "source": "fb_bolsa_mx"},
    {"nombre": "Bolsa de trabajo CDMX", "source": "fb_cdmx"},
    {"nombre": "BOLSA DE TRABAJO MONTERREY", "source": "fb_mty"},
    {"nombre": "Empleos Bolsa de Trabajo Mexicali", "source": "fb_mxli"},
    {"nombre": "BOLSA DE TRABAJO", "source": "fb_bolsa"},
    {"nombre": "VACANTES DE EMPLEO", "source": "fb_vacantes"},
]

_HORA_UTC = time(15, 0)  # 9:00 CDMX

def _dt(d: date) -> datetime:
    return datetime.combine(d, _HORA_UTC, tzinfo=timezone.utc)

def plan_semana(inicio: date) -> list[dict]:
    """8 piezas de la semana que empieza en `inicio` (lunes)."""
    semana = inicio.isocalendar().week
    temas = TEMAS[(semana * 3) % len(TEMAS):] + TEMAS[:(semana * 3) % len(TEMAS)]
    pool = iter(temas)
    items: list[dict] = []
    # Página FB + IG: lun educativo, mié anticoyote/confianza, vie caso o mito
    for offset, formato in [(0, "sabias_que"), (2, "anticoyote"), (4, "caso" if semana % 2 else "mito")]:
        items.append({
            "tema": next(pool)["code"], "formato": formato, "plantilla": "tarjeta",
            "channels": ["fb_page", "ig"], "scheduled_at": _dt(inicio + timedelta(days=offset)),
            "source": "fb_page" if offset != 0 else "ig_perfil",
        })
    # Grupos: mar/jue/sáb, grupo en turno rota por semana
    for n, offset in enumerate([1, 3, 5]):
        grupo = GRUPOS[(semana + n) % len(GRUPOS)]
        items.append({
            "tema": next(pool)["code"], "formato": "caso" if n == 2 else "checklist",
            "plantilla": "tarjeta", "channels": ["grupo"],
            "scheduled_at": _dt(inicio + timedelta(days=offset)), "source": grupo["source"],
        })
    # TikTok: mié/sáb carruseles
    for offset in [2, 5]:
        items.append({
            "tema": next(pool)["code"], "formato": "carrusel", "plantilla": "lamina",
            "channels": ["tiktok"], "scheduled_at": _dt(inicio + timedelta(days=offset)),
            "source": "tiktok",
        })
    return items
