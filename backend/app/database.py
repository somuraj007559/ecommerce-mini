from sqlalchemy import create_engine;
from sqlalchemy.orm import sessionmaker,declarative_base;
from dotenv import load_dotenv;
import os;

load_dotenv();

DATABASE_URL = os.environ["DATABASE_URL"];

engine = create_engine(DATABASE_URL, echo=True);

Session = sessionmaker(bind=engine , autocommit=False, autoflush=False);

Base = declarative_base();

# // get database session

def get_db():
    db = Session();
    try:
        yield db
    finally:
        db.close();
