from app.database import Base, engine

from app.models.product import Product
from app.models.order import Order, OrderItem

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")
