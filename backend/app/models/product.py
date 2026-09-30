# // orm model 

from app.database import Base;
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean;

class Product(Base):
    __tablename__ = "products";
    id = Column(Integer, primary_key=True, index=True);
    name = Column(String, index=True);
    description = Column(String, index=True);
    price = Column(Float, index=True);
    image = Column(String, index=True);
    stock = Column(Integer, nullable=False, default=0)