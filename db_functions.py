import pymysql

# ------------------ Connection ------------------
def connect_to_db():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="Sushant@28",
        database="myProject",
        cursorclass=pymysql.cursors.DictCursor
    )

# ------------------ Basic Info ------------------
def get_basic_info(cursor):
    queries = {
        "Total Suppliers": "SELECT COUNT(*) AS count FROM suppliers",
        "Total Products": "SELECT COUNT(*) AS count FROM products",
        "Total Categories Dealing": "SELECT COUNT(DISTINCT category) AS count FROM products",
        "Total Sale Value (Last 6 Months)": """
            SELECT ROUND(SUM(ABS(se.change_quantity) * p.price), 2) AS total_sale
            FROM stock_entries se
            JOIN products p ON se.product_id = p.product_id
            WHERE se.change_type = 'Sale'
            AND se.entry_date >= (
                SELECT DATE_SUB(MAX(entry_date), INTERVAL 6 MONTH) FROM stock_entries
            )
        """,
        "Total Restock Value (Last 6 Months)": """
            SELECT ROUND(SUM(se.change_quantity * p.price), 2) AS total_restock
            FROM stock_entries se
            JOIN products p ON se.product_id = p.product_id
            WHERE se.change_type = 'Restock'
            AND se.entry_date >= (
                SELECT DATE_SUB(MAX(entry_date), INTERVAL 6 MONTH) FROM stock_entries
            )
        """,
        "Below Reorder & No Pending Reorders": """
            SELECT COUNT(*) AS below_reorder
            FROM products p
            WHERE p.stock_quantity < p.reorder_level
            AND p.product_id NOT IN (
                SELECT DISTINCT product_id FROM reorders WHERE status = 'Pending'
            )
        """
    }

    result = {}
    for label, query in queries.items():
        cursor.execute(query)
        row = cursor.fetchone()
        if row is not None:
            result[label] = row.get("count") or row.get("total_sale") or row.get("total_restock")
        else:
            result[label] = 0
    return result

def get_paginated_table(cursor, table_name, offset, limit):
    queries = {
        "Suppliers Contact Details": "SELECT supplier_name, contact_name, email, phone FROM suppliers ORDER BY supplier_name ASC LIMIT %s OFFSET %s",
        "Products with Supplier and Stock": """
            SELECT
                p.product_name,
                s.supplier_name,
                p.stock_quantity,
                p.reorder_level
            FROM products p
            JOIN suppliers s ON p.supplier_id = s.supplier_id
            ORDER BY p.product_name ASC
            LIMIT %s OFFSET %s
        """,
        "Products Needing Reorder": """
            SELECT product_name, stock_quantity, reorder_level
            FROM products
            WHERE stock_quantity <= reorder_level
            ORDER BY product_name ASC
            LIMIT %s OFFSET %s
        """
    }
    
    query = queries.get(table_name)
    if not query:
        return []
    
    cursor.execute(query, (limit, offset))
    return cursor.fetchall()


# ------------------ Categories & Suppliers ------------------
def get_categories(cursor):
    cursor.execute("SELECT DISTINCT category FROM products ORDER BY category ASC")
    rows = cursor.fetchall()
    return [row["category"] for row in rows]

def get_suppliers(cursor):
    cursor.execute("SELECT supplier_id, supplier_name FROM suppliers ORDER BY supplier_name ASC")
    return cursor.fetchall()

# ------------------ Add New Product ------------------
def add_new_manual_id(cursor, db, p_name, p_category, p_price, p_stock, p_reorder, p_supplier):
    proc_call = "CALL AddNewProductManualID(%s, %s, %s, %s, %s, %s)"
    params = (p_name, p_category, p_price, p_stock, p_reorder, p_supplier)
    cursor.execute(proc_call, params)
    db.commit()

# ------------------ Products ------------------
def get_all_products(cursor):
    cursor.execute("SELECT product_id, product_name FROM products ORDER BY product_name")
    return cursor.fetchall()

def get_product_history(cursor, product_id):
    query = "SELECT * FROM product_inventory_history WHERE product_id = %s ORDER BY record_date DESC"
    cursor.execute(query, (product_id,))
    return cursor.fetchall()

# ------------------ Reorders ------------------
def place_reorder(cursor, db, product_id, reorder_quantity):
    query = """
        INSERT INTO reorders (reorder_id, product_id, reorder_quantity, reorder_date, status)
        SELECT
            COALESCE(MAX(reorder_id),0)+1,
            %s,
            %s,
            CURDATE(),
            'Ordered'
        FROM reorders;
    """
    cursor.execute(query, (product_id, reorder_quantity))
    db.commit()

def get_pending_reorders(cursor):
    cursor.execute("""
        SELECT r.reorder_id, p.product_name
        FROM reorders AS r
        JOIN products AS p ON r.product_id = p.product_id
        WHERE r.status = 'Ordered' OR r.status = 'Pending'
    """)
    return cursor.fetchall()

def mark_reorder_as_received(cursor, db, reorder_id):
    cursor.execute("CALL MarkReorderAsReceived(%s)", (reorder_id,))
    db.commit()