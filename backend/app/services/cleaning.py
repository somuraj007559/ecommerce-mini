import json

import pandas as pd

IMAGE_PREFIX = "/static/images/"

# The products table has no category column, so map each product name to a category.
CATEGORY_MAP = {
    "Samsung Galaxy S24": "Mobiles",
    "OnePlus 12": "Mobiles",
    "iPhone 15": "Mobiles",
    "Laptop": "Computers",
    "Mouse": "Accessories",
    "Keyboard": "Accessories",
    "Sony WH-1000XM5": "Accessories",
    "Notebook": "Stationery",
    "Pen": "Stationery",
}


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

    # Empty or non-numeric price becomes 0. Keep float64 for money values.
    cleaned["price"] = pd.to_numeric(cleaned["price"], errors="coerce")
    cleaned["price"] = cleaned["price"].fillna(0).astype("float64")

    # Empty or non-numeric stock becomes 0. int32 uses less memory.
    cleaned["stock"] = pd.to_numeric(cleaned["stock"], errors="coerce")
    cleaned["stock"] = cleaned["stock"].fillna(0).astype("int32")

    # Clean these columns only when present. The category query does not select them.
    if "description" in cleaned.columns:
        cleaned["description"] = cleaned["description"].where(cleaned["description"].notna(), None)
    if "image" in cleaned.columns:
        image_column = cleaned["image"]
        # Only handle a single column. A duplicate column name would return a DataFrame.
        if isinstance(image_column, pd.Series):
            cleaned["image"] = _fix_images(image_column)

    return cleaned.reset_index(drop=True)


def _fix_images(series: pd.Series) -> pd.Series:
    """Vectorized version of _fix_image. Clean a whole image column at once, without a row loop."""
    # Treat missing as blank, then trim spaces.
    text = series.fillna("").astype(str).str.strip()
    missing = text.eq("")
    # URLs and paths stay as they are. Only filename rows get the prefix.
    needs_prefix = ~(missing | text.str.startswith(("http://", "https://", "/")))
    fixed = text.copy()
    fixed.loc[needs_prefix] = IMAGE_PREFIX + text.loc[needs_prefix]
    # An empty image must be null in JSON.
    return fixed.mask(missing, None)


def to_json_safe(df: pd.DataFrame) -> list[dict]:
    # pandas NaN is invalid JSON. to_json turns it into null and returns a list of dicts.
    # Without a file path, to_json returns a string. The type checker also allows None, so fall back to an empty list.
    payload = df.to_json(orient="records") or "[]"
    return json.loads(payload)
