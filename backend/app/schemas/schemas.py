# // model request data model pyndantic --> json to python object and validate the data , python object to json;
from pydantic import BaseModel, ConfigDict, Field;

class ProductBase(BaseModel):
    # Strip whitespace before min_length is checked, so a name like "   " is rejected
    model_config = ConfigDict(str_strip_whitespace=True);

    name: str = Field(min_length=1, max_length=255);
    description: str | None = None;
    # Rejects "abc", NaN, infinity, zero and negative values
    price: float = Field(gt=0, allow_inf_nan=False);
    image: str | None = None;
    # Fractional stock like 10.5 is rejected
    stock: int = Field(default=0, ge=0);

# // model request data model for create product
class ProductCreate(ProductBase):
    pass;

# // model response data model
class Product(ProductBase):
    model_config = ConfigDict(from_attributes=True);

    id: int;
