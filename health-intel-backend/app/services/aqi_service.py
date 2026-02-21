"""
AQI Service — fetches Air Quality Index data for a location.
Uses the WAQI (World Air Quality Index) free API.

Get a free token at: https://aqicn.org/api/
Add to .env: WAQI_API_KEY=your_token_here
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
WAQI_TOKEN = os.getenv("WAQI_API_KEY", "")

# AQI category labels
AQI_CATEGORIES = {
    (0, 50):   "Good",
    (51, 100): "Moderate",
    (101, 150): "Unhealthy for Sensitive Groups",
    (151, 200): "Unhealthy",
    (201, 300): "Very Unhealthy",
    (301, 999): "Hazardous",
}


def categorize_aqi(aqi: int) -> str:
    for (low, high), label in AQI_CATEGORIES.items():
        if low <= aqi <= high:
            return label
    return "Unknown"


def fetch_aqi(location: str) -> dict | None:
    """
    Fetch AQI for a location string (city name or lat,lng).

    Returns a dict:
    {
        "aqi": int,
        "category": str,
        "dominant_pollutant": str,
        "station": str,
        "location_queried": str
    }

    Returns None if the call fails or the token is missing.
    Failures are always silent — assessment proceeds without AQI.
    """
    if not WAQI_TOKEN or WAQI_TOKEN == "demo":
        # No key → return mock data for demo
        return _mock_aqi(location)

    url = f"https://api.waqi.info/feed/{location}/?token={WAQI_TOKEN}"
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()

        if data.get("status") != "ok":
            return None

        aqi_val = data["data"].get("aqi")
        if not isinstance(aqi_val, int):
            return None

        city_name = (
            data["data"]
            .get("city", {})
            .get("name", location)
        )

        # Dominant pollutant (if available)
        dominant = data["data"].get("dominentpol", "pm25")

        return {
            "aqi": aqi_val,
            "category": categorize_aqi(aqi_val),
            "dominant_pollutant": dominant,
            "station": city_name,
            "location_queried": location,
        }

    except Exception:
        # Network error / malformed response → silent failure
        return None


def _mock_aqi(location: str) -> dict:
    """
    Returns a plausible mock AQI value for demo when no API key is set.
    Deterministic based on location string hash so it's stable across calls.
    """
    import hashlib
    seed = int(hashlib.md5(location.lower().encode()).hexdigest(), 16) % 200
    aqi_val = 30 + seed  # Range: 30–229

    return {
        "aqi": aqi_val,
        "category": categorize_aqi(aqi_val),
        "dominant_pollutant": "pm25",
        "station": f"{location} (simulated)",
        "location_queried": location,
    }
