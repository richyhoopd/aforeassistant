"""ENTRYPOINT Proceso C — recolector diario de métricas (corre tras publish en Actions).

Orgánico: snapshots FB/IG de cada pieza publicada. Ads: dormido hasta
configurar ADS_ACCOUNT_ID. Uso: python metrics.py
"""
from __future__ import annotations
from datetime import date
from src.ads import collect_ads
from src.insights import collect

if __name__ == "__main__":
    hoy = date.today().isoformat()
    print({"organic_snapshots": collect(hoy), "ad_campaigns": collect_ads(hoy)})
