from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

def product_response(product: Product):
    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "image": product.image,
        "description": product.description,
        "stock": product.stock,
    }

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.id).all()
    return [product_response(product) for product in products]

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_response(product)
