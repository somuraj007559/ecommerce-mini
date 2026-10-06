import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

# Load DATABASE_URL from the .env file.
load_dotenv()

database_url = os.environ["DATABASE_URL"]

# Credentials stay in .env. Only the driver is set to postgresql+psycopg (v3).
url = make_url(database_url).set(drivername="postgresql+psycopg")

# This engine is the database connection used by pandas read_sql.
engine = create_engine(url)
