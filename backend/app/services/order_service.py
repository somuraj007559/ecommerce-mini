from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.order import Order, OrderItem

class BusinessError(Exception):
    pass

def create_order(db: Session, customer_id: int, items: list, coupon_code: str | None):
    # 1. Empty order check
    if not items:
        raise BusinessError("Order must contain at least one product")

    # 2. Duplicate product check
    product_ids = [item.product_id for item in items]

    if len(product_ids) != len(set(product_ids)):
        raise BusinessError("Same product cannot be added twice")

    # 3. Products fetch
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )

    product_map = {
        product.id: product
        for product in products
    }

    # 4. Check product existence and stock
    for item in items:
        product = product_map.get(item.product_id)

        if not product:
            raise BusinessError(
                f"Product {item.product_id} not found"
            )

        if product.stock < item.quantity:
            raise BusinessError(
                f"Only {product.stock} items available for {product.name}"
            )

    # 5. Calculate subtotal
    subtotal = 0

    calculated_items = []

    for item in items:
        product = product_map[item.product_id]

        item_total = product.price * item.quantity
        subtotal += item_total

        calculated_items.append({
            "product": product,
            "quantity": item.quantity,
            "price": product.price,
            "total": item_total
        })

    # 6. Coupon discount logic
    discount = 0

    if coupon_code:
        coupon_code = coupon_code.upper()

        if coupon_code == "SAVE10":
            if subtotal >= 1000:
                discount = int(subtotal * 0.10)
            else:
                raise BusinessError(
                    "SAVE10 coupon requires minimum order ₹1000"
                )

        elif coupon_code == "FLAT100":
            if subtotal >= 500:
                discount = 100
            else:
                raise BusinessError(
                    "FLAT100 coupon requires minimum order ₹500"
                )

        else:
            raise BusinessError("Invalid coupon code")

    # 7. Tax calculation
    taxable_amount = subtotal - discount
    tax = int(taxable_amount * 0.18)

    # 8. Shipping charge
    if taxable_amount >= 1000:
        shipping_charge = 0
    else:
        shipping_charge = 50

    # 9. Grand total
    grand_total = (
        taxable_amount
        + tax
        + shipping_charge
    )

    try:
        # 10. Create order
        order = Order(
            customer_id=customer_id,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            shipping_charge=shipping_charge,
            grand_total=grand_total,
            status="confirmed"
        )

        db.add(order)
        db.flush()

        # 11. Create order items and reduce stock
        for calculated_item in calculated_items:
            product = calculated_item["product"]
            quantity = calculated_item["quantity"]
            price = calculated_item["price"]
            total = calculated_item["total"]

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price=price,
                total=total
            )

            db.add(order_item)

            # Stock reduce
            product.stock -= quantity

        # 12. Save everything
        db.commit()
        db.refresh(order)

        return order

    except Exception:
        # if any error occurs, order + stock changes will be rolled back
        db.rollback()
        raise
