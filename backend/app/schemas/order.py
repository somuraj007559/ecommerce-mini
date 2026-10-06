from pydantic import BaseModel, Field
from typing import List, Optional

MAX_QUANTITY_PER_ITEM = 100
MAX_ITEMS_PER_ORDER = 50

class OrderItemRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=MAX_QUANTITY_PER_ITEM)

class OrderCreateRequest(BaseModel):
    customer_id: int = Field(gt=0)
    items: List[OrderItemRequest] = Field(min_length=1, max_length=MAX_ITEMS_PER_ORDER)
    coupon_code: Optional[str] = Field(default=None, max_length=20)
