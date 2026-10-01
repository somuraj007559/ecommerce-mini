import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path


def setup_logging():
    # Create logs folder if not exists
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Log format
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Clear old handlers (important)
    if logger.hasHandlers():
        logger.handlers.clear()

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))

    # File Handler (Rotating)
    file_handler = RotatingFileHandler(
        filename=log_dir / "minishop.log",
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(log_format, datefmt=date_format))

    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    # Reduce noisy logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    return logger