from fastapi import APIRouter
from backend.config import settings

router = APIRouter(prefix="/serpapi", tags=["SerpApi"])

@router.get("/stats")
def get_serpapi_stats():
    """
    Returns a lightweight SERP API health and usage summary.
    If the backend is configured with a SERP_API_KEY, it returns a simulated
    traffic summary compatible with the existing frontend telemetry chart.
    """
    if not settings.SERP_API_KEY:
        return {
            "queriesRemaining": 0,
            "queriesLimit": 0,
            "activeScansSpeed": "Unavailable (SERP_API_KEY not configured)"
        }

    return {
        "queriesRemaining": 84,
        "queriesLimit": 100,
        "activeScansSpeed": "Fast (1.2s)"
    }
