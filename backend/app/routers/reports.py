import pandas as pd
from fastapi import APIRouter, Query
from sqlalchemy import text

from app.db import engine
from app.services.cleaning import CATEGORY_MAP, clean_products, to_json_safe

router = APIRouter(tags=["Reports"])


def _read_products(sql: str, params: dict | None = None) -> pd.DataFrame:
    # Pass user values with text() + params, not inside the SQL string.
    query = text(sql)
    with engine.connect() as connection:
        return pd.read_sql(query, connection, params=params or {})


@router.get("/products/low-stock")
def low_stock(threshold: int = Query(10, ge=0)):
    # Filter low stock in SQL, not in Python.
    sql = """
        SELECT id, name, description, price, image, stock
        FROM products
        WHERE stock <= :threshold
        ORDER BY stock ASC, id ASC
    """
    products = _read_products(sql, {"threshold": threshold})
    products = clean_products(products)
    return to_json_safe(products)


@router.get("/reports/inventory")
def inventory_report(max_price: float = Query(100000, ge=0)):
    # Exclude products above max_price in SQL.
    # Read rows in id order so nlargest keeps the smaller id first on a tie.
    sql = """
        SELECT id, name, description, price, image, stock
        FROM products
        WHERE price <= :max_price
        ORDER BY id
    """
    products = _read_products(sql, {"max_price": max_price})
    products = clean_products(products)

    # Inventory value for one product is price * stock.
    products["inventory_value"] = products["price"] * products["stock"]

    # Keep the 3 products with the highest inventory value. Ties keep id order.
    top_products = products.nlargest(3, "inventory_value")

    return to_json_safe(top_products)


@router.get("/reports/category-summary")
def category_summary():
    # The category report only needs name, price, and stock.
    sql = """
        SELECT id, name, price, stock
        FROM products
    """
    products = _read_products(sql)
    products = clean_products(products)

    # Look up the category from the dictionary. Unmapped names become "Other".
    products["category"] = products["name"].map(lambda name: CATEGORY_MAP.get(name, "Other")).astype("category")
    products["inventory_value"] = products["price"] * products["stock"]

    # Per category: count, total stock, average price, and inventory value.
    # observed=True returns only categories present in the data.
    summary = pd.DataFrame(
        products.groupby("category", as_index=False, observed=True).agg(
            product_count=("name", "count"),
            total_stock=("stock", "sum"),
            avg_price=("price", "mean"),
            inventory_value=("inventory_value", "sum"),
        )
    )
    summary["avg_price"] = summary["avg_price"].round(2)
    summary["inventory_value"] = summary["inventory_value"].round(2)
    summary = summary.sort_values("category").reset_index(drop=True)

    return to_json_safe(summary)
