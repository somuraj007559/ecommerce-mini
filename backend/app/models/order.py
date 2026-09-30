from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    subtotal = Column(Integer, nullable=False)
    discount = Column(Integer, default=0)
    tax = Column(Integer, default=0)
    shipping_charge = Column(Integer, default=0)
    grand_total = Column(Integer, nullable=False)
    status = Column(String, default="confirmed")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
