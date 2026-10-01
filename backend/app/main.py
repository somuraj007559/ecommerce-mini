from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions import AppException
from app.core.handlers import app_exception_handler, general_exception_handler
from app.routers.orders import router as order_router
from app.routers.products import router as product_router

from app.core.logging import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)

logger.info("This is an INFO message")
logger.warning("This is a WARNING message")
logger.error("This is an ERROR message")

app = FastAPI(title="MiniShop API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    order_router,
    prefix="/api"
)
app.include_router(
    product_router,
    prefix="/api"
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

@app.get("/")
def home():
    return {
        "message": "MiniShop API is running"
    }
