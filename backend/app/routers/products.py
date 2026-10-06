import ijson
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import ValidationError
from sqlalchemy import func, insert, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.services.product_service import get_product, list_products
from app.models.product import Product
from app.schemas.schemas import ProductCreate
from app.core.exceptions import DatabaseException, DataProcessingException

logger = logging.getLogger(__name__)
BATCH_SIZE = 100


def _format_validation_error(error: ValidationError) -> str:
    # "price: Input should be greater than 0" maari user ku puriyura message
    messages = []
    for detail in error.errors():
        field = ".".join(str(part) for part in detail["loc"]) or "item"
        messages.append(f"{field}: {detail['msg']}")
    return "; ".join(messages)

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
    batch = []

    def save_batch():
        if not batch:
            return
        db.execute(insert(Product), batch)
        db.commit()
        logger.info(f"Committed {success_count} products...")
        batch.clear()

    try:
        # "Pen" and "pen " same product ah eduthukrom, so lower case la compare panrom
        seen_names = set(db.scalars(select(func.lower(Product.name))).all())

        objects = ijson.items(file.file, "item")  # type: ignore[reportCallIssue]

        for index, data in enumerate(objects, start=1):
            try:
                try:
                    product = ProductCreate.model_validate(data)
                except ValidationError as e:
                    raise ValueError(_format_validation_error(e))

                name_key = product.name.lower()
                if name_key in seen_names:
                    raise ValueError(f"duplicate product name '{product.name}'")
                seen_names.add(name_key)

                batch.append(product.model_dump())
                success_count += 1

                if len(batch) == BATCH_SIZE:
                    save_batch()

            except (ValueError, KeyError, TypeError) as e:
                error_count += 1
                errors.append(f"Item {index}: {str(e)}")
                logger.warning(f"Skipping item {index}: {str(e)}")

        save_batch()
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
