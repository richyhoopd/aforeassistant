from __future__ import annotations
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_service_key: str
    deepseek_api_key: str
    telegram_token: str
    telegram_chat_id: str
    fb_page_id: str
    fb_page_token: str
    ig_user_id: str
    site_url: str

def cfg() -> Config:
    return Config(
        supabase_url=os.environ.get("SUPABASE_URL", ""),
        supabase_service_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""),
        deepseek_api_key=os.environ.get("DEEPSEEK_API_KEY", ""),
        telegram_token=os.environ.get("TELEGRAM_BOT_TOKEN", ""),
        telegram_chat_id=os.environ.get("TELEGRAM_CHAT_ID", ""),
        fb_page_id=os.environ.get("FB_PAGE_ID", ""),
        fb_page_token=os.environ.get("FB_PAGE_TOKEN", ""),
        ig_user_id=os.environ.get("IG_USER_ID", ""),
        site_url=os.environ.get("SITE_URL", "https://www.pensionmas.com.mx"),
    )
