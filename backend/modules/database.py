"""
modules/database.py
MongoDB connection utilities and minimal helpers.
"""
import sys
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import re
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from datetime import datetime
import os
from dotenv import load_dotenv
from bson import ObjectId
from bson.errors import InvalidId

load_dotenv()
_backend_env = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(_backend_env):
    load_dotenv(_backend_env)


# Fix for Docker / Hugging Face Spaces: public DNS fallback for mongodb+srv records
try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1', '8.8.4.4']
    dns.resolver.default_resolver.lifetime = 2.0
    dns.resolver.default_resolver.timeout = 2.0
except Exception:
    pass

def sanitize_mongodb_url(raw_url: Optional[str]) -> Optional[str]:
    """Ensure password special characters like '@' are safely percent-encoded."""
    if not raw_url:
        return raw_url
    raw_url = raw_url.strip()
    m = re.match(r'^(mongodb(?:\+srv)?://)([^:]+):(.*)@([^@/]+)(.*)$', raw_url)
    if m:
        scheme, user, password, host, rest = m.groups()
        if '@' in password:
            enc_password = urllib.parse.quote_plus(password)
            return f"{scheme}{user}:{enc_password}@{host}{rest}"
    return raw_url

MONGODB_URL = sanitize_mongodb_url(os.getenv("MONGODB_URL", None))
DATABASE_NAME = os.getenv("DATABASE_NAME", "moodtunes_ai")

# Global client + database
_client: Optional[AsyncIOMotorClient] = None
_database = None

async def connect_to_mongodb():
    """Connect to MongoDB and ensure indexes."""
    global _client, _database
    if not MONGODB_URL:
        print("⚠️  MONGODB_URL not set in environment. MongoDB features will be disabled.")
        _database = None
        return

    try:
        _client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            socketTimeoutMS=3000
        )
        _database = _client[DATABASE_NAME]
        # Test connection on database directly (avoids admin database privilege restrictions)
        try:
            await _database.command("ping")
        except Exception:
            await _client.admin.command("ping")
        # Ensure indexes
        try:
            await _database.users.create_index("email", unique=True)
            await _database.playlists.create_index("user_id")
        except Exception:
            pass
        print(f"✅ Connected to MongoDB Atlas: {DATABASE_NAME}")
    except Exception as e:
        print(f"⚠️  MongoDB connection note: {e}. Persistent local disk storage active.")
        _database = None

async def close_mongodb_connection():
    global _client
    if _client:
        _client.close()
        print("✅ MongoDB connection closed")

def get_database():
    """Return DB instance or None."""
    return _database
