from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import DatabaseException
from app.models.product import Product

def product_response(product: Product):
    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "image": product.image,
        "description": product.description,
        "stock": product.stock,
    }

def list_products(db: Session):
    try:
        products = db.query(Product).order_by(Product.id).all()
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Unable to fetch products")
    return [product_response(product) for product in products]

def get_product(db: Session, product_id: int):
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
    except SQLAlchemyError:
        db.rollback()
        raise DatabaseException("Unable to fetch products")
    if product is None:
        return None
    return product_response(product)
