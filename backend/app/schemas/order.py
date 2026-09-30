from pydantic import BaseModel, Field
from typing import List, Optional

class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class OrderCreateRequest(BaseModel):
    customer_id: int
    items: List[OrderItemRequest]
    coupon_code: Optional[str] = None
