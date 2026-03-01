from fastapi import APIRouter, Query
from app.services.aqi_service import fetch_aqi

router = APIRouter(prefix="/aqi", tags=["aqi"])


@router.get("")
def get_aqi(location: str = Query(..., description="City name or lat,lng e.g. 'Mumbai' or '19.0760,72.8777'")):
    """
    Fetch current Air Quality Index for a location.
    Returns AQI value, category, and dominant pollutant.

    If no WAQI_API_KEY is set in .env, returns a deterministic mock for demo.
    """
    result = fetch_aqi(location)
    if result is None:
        return {
            "error": "Could not fetch AQI for this location. "
                     "Check WAQI_API_KEY in .env or try a different location name."
        }
    return result
