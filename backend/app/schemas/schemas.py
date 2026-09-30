# // model request data model pyndantic --> json to python object and validate the data , python object to json;
from pydantic import BaseModel;

class ProductBase(BaseModel):
    name: str;
    description: str | None = None;
    price: float;
    image: str | None = None;

# // model request data model for create product
class ProductCreate(ProductBase):
    pass;

# // model response data model
class Product(ProductBase):
    id: int;
    class Config:
        orm_mode = True;