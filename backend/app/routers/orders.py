from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import OrderCreateRequest
from app.services.order_service import (
    create_order,
    BusinessError
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/")
def place_order(
    request: OrderCreateRequest,
    db: Session = Depends(get_db)
):
    try:
        order = create_order(
            db=db,
            customer_id=request.customer_id,
            items=request.items,
            coupon_code=request.coupon_code
        )

        return {
            "message": "Order created successfully",
            "order_id": order.id,
            "subtotal": order.subtotal,
            "discount": order.discount,
            "tax": order.tax,
            "shipping_charge": order.shipping_charge,
            "grand_total": order.grand_total,
            "status": order.status
        }

    except BusinessError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )
