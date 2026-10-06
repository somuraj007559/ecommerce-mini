import pandas as pd
from fastapi import APIRouter, Query
from sqlalchemy import text

from app.db import engine
from app.services.cleaning import category_table, clean_products, to_json_safe

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
    sql = """
        SELECT id, name, description, price, image, stock
        FROM products
        WHERE price <= :max_price
    """
    products = _read_products(sql, {"max_price": max_price})
    products = clean_products(products)

    # Inventory value for one product is price * stock.
    products["inventory_value"] = products["price"] * products["stock"]

    # Keep only the 3 products with the highest inventory value.
    top_products = products.sort_values(
        by=["inventory_value", "id"],
        ascending=[False, True],
    ).head(3)

    return to_json_safe(top_products)


@router.get("/reports/category-summary")
def category_summary():
    sql = """
        SELECT id, name, description, price, image, stock
        FROM products
    """
    products = _read_products(sql)
    products = clean_products(products)

    # Category data is a separate DataFrame. Merge it with products on name.
    categories = category_table()
    merged = products.merge(categories, on="name", how="left")

    # Products missing from the category map become "Other".
    merged["category"] = merged["category"].fillna("Other")
    merged["inventory_value"] = merged["price"] * merged["stock"]

    # Per category: count, total stock, average price, and inventory value.
    # Wrap the groupby result as a DataFrame so column updates type-check.
    summary = pd.DataFrame(
        merged.groupby("category", as_index=False).agg(
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
