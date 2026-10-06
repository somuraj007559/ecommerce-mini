import json

import pandas as pd

IMAGE_PREFIX = "/static/images/"


def clean_products(df: pd.DataFrame) -> pd.DataFrame:
    """Clean product rows and return a new DataFrame."""
    cleaned = df.copy()

    # Treat a missing name as blank, then trim spaces.
    cleaned["name"] = cleaned["name"].fillna("").astype(str).str.strip()

    # Drop rows with no name.
    # query() returns a DataFrame, so the next call type-checks.
    cleaned = cleaned.query("name != ''")

    # If the same name appears twice, keep the first row.
    cleaned = cleaned.drop_duplicates(subset="name", keep="first")

    # Empty or non-numeric price/stock becomes NaN. fillna runs on the Series.
    cleaned["price"] = pd.to_numeric(cleaned["price"], errors="coerce")
    cleaned["price"] = cleaned["price"].fillna(0)
    cleaned["stock"] = pd.to_numeric(cleaned["stock"], errors="coerce")
    cleaned["stock"] = cleaned["stock"].fillna(0).astype(int)

    # Keep a missing description as null. Add a prefix to filename-only images.
    cleaned["description"] = cleaned["description"].where(cleaned["description"].notna(), None)
    cleaned["image"] = cleaned["image"].map(_fix_image)

    return cleaned.reset_index(drop=True)


def _fix_image(value):
    # A missing image becomes None, which is null in JSON.
    if pd.isna(value):
        return None

    image = str(value).strip()
    if image == "":
        return None

    # Leave a full URL unchanged.
    if image.startswith("http://") or image.startswith("https://"):
        return image

    # Leave an existing path unchanged so the prefix is not added twice.
    if image.startswith("/"):
        return image

    # A filename such as "pen.jpg" gets the static images prefix.
    return IMAGE_PREFIX + image


def category_table() -> pd.DataFrame:
    """
    The products table has no category column.
    This DataFrame maps each product name to a category.
    """
    rows = [
        {"name": "Samsung Galaxy S24", "category": "Mobiles"},
        {"name": "OnePlus 12", "category": "Mobiles"},
        {"name": "iPhone 15", "category": "Mobiles"},
        {"name": "Laptop", "category": "Computers"},
        {"name": "Mouse", "category": "Accessories"},
        {"name": "Keyboard", "category": "Accessories"},
        {"name": "Sony WH-1000XM5", "category": "Accessories"},
        {"name": "Notebook", "category": "Stationery"},
        {"name": "Pen", "category": "Stationery"},
    ]
    return pd.DataFrame(rows)


def to_json_safe(df: pd.DataFrame) -> list[dict]:
    # pandas NaN is invalid JSON. to_json turns it into null and returns a list of dicts.
    # Without a file path, to_json returns a string. The type checker also allows None, so fall back to an empty list.
    payload = df.to_json(orient="records") or "[]"
    return json.loads(payload)
