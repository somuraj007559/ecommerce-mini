import ijson
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.services.product_service import get_product, list_products
from app.models.product import Product
from app.core.exceptions import DatabaseException, DataProcessingException

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return list_products(db)

@router.get("/{product_id}")
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/import")
async def import_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    filename = file.filename or ""
    if not filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Only .json files are allowed")

    success_count = 0
    error_count = 0
    errors = []

    try:
        objects = ijson.items(file.file, "item")  # type: ignore[reportCallIssue]

        for index, data in enumerate(objects, start=1):
            try:
                if not data.get("name") or data.get("price") is None:
                    raise ValueError("name and price are required")

                product = Product(
                    name=data["name"],
                    price=data["price"],
                    stock=data.get("stock", 0),
                    description=data.get("description"),
                    image=data.get("image")
                )

                db.add(product)
                success_count += 1

                if success_count % 100 == 0:
                    db.commit()
                    logger.info(f"Committed {success_count} products...")

            except (ValueError, KeyError, TypeError) as e:
                error_count += 1
                errors.append(f"Item {index}: {str(e)}")
                logger.warning(f"Skipping item {index}: {str(e)}")

        db.commit()
        logger.info(f"Import finished → Success: {success_count}, Failed: {error_count}")

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise DatabaseException("Failed to import products due to database error")

    except Exception as e:
        db.rollback()
        logger.error(f"File processing error: {str(e)}")
        raise DataProcessingException("Error while processing the JSON file")

    return {
        "success": True,
        "message": "Products imported successfully",
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:10]
    }
