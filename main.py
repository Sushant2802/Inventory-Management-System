from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pymysql
from contextlib import contextmanager

from db_functions import (
    connect_to_db,
    get_basic_info,
    get_paginated_table,
    get_categories,
    get_suppliers,
    add_new_manual_id,
    get_all_products,
    get_product_history,
    place_reorder,
    get_pending_reorders,
    mark_reorder_as_received,
)

app = FastAPI()

# Pydantic models for request body validation
class AddProductRequest(BaseModel):
    product_name: str
    category: str
    price: float
    stock_quantity: int
    reorder_level: int
    supplier_id: int

class PlaceReorderRequest(BaseModel):
    product_id: int
    reorder_quantity: int

# Dependency to get a database connection and cursor
@contextmanager
def get_db():
    conn = None
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        yield cursor, conn
    finally:
        if conn:
            conn.close()

# ------------------ API Endpoints ------------------

@app.get("/api/basic_info")
def basic_info_endpoint():
    try:
        with get_db() as (cursor, _):
            basic_info = get_basic_info(cursor)
            return {"basic_info": basic_info}
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/tables/{table_name}")
def get_paginated_table_endpoint(table_name: str, offset: int = 0, limit: int = 10):
    try:
        with get_db() as (cursor, _):
            return get_paginated_table(cursor, table_name, offset, limit)
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/categories")
def get_categories_endpoint():
    try:
        with get_db() as (cursor, _):
            return get_categories(cursor)
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/suppliers")
def get_suppliers_endpoint():
    try:
        with get_db() as (cursor, _):
            return get_suppliers(cursor)
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.post("/api/add_product")
def add_product_endpoint(product: AddProductRequest):
    try:
        with get_db() as (cursor, conn):
            add_new_manual_id(
                cursor,
                conn,
                product.product_name,
                product.category,
                product.price,
                product.stock_quantity,
                product.reorder_level,
                product.supplier_id
            )
        return {"message": f"Product '{product.product_name}' added successfully"}
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/products")
def get_products_endpoint():
    try:
        with get_db() as (cursor, _):
            return get_all_products(cursor)
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/product_history/{product_id}")
def get_history_endpoint(product_id: int):
    try:
        with get_db() as (cursor, _):
            return get_product_history(cursor, product_id)
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.post("/api/place_reorder")
def place_reorder_endpoint(reorder_data: PlaceReorderRequest):
    try:
        with get_db() as (cursor, conn):
            place_reorder(cursor, conn, reorder_data.product_id, reorder_data.reorder_quantity)
        return {"message": "Reorder placed successfully"}
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.get("/api/pending_reorders")
def get_pending_reorders_endpoint():
    try:
        with get_db() as (cursor, _):
            return get_pending_reorders(cursor)
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@app.post("/api/receive_reorder/{reorder_id}")
def receive_reorder_endpoint(reorder_id: int):
    try:
        with get_db() as (cursor, conn):
            mark_reorder_as_received(cursor, conn, reorder_id)
        return {"message": f"Reorder ID {reorder_id} marked as received"}
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# Serve static files (HTML, CSS, JS)
app.mount("/", StaticFiles(directory=".", html=True), name="static")