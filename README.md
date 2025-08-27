# 📦 Inventory Management System (Full-Stack Project)

An **Inventory Management System with a Web UI for Advanced SQL Database Operations**.  
This project allows users to manage inventory, suppliers, stock levels, and reorders through a simple, interactive web interface — without needing to write SQL queries.

---

## 🚀 Features
- 📊 **Dashboard Metrics**
  - Total sales, pending reorders, and stock health
- 🗂 **Product Management**
  - Add new products with category, supplier, price, stock, and reorder levels
  - View product inventory history
- 🔄 **Reorder Management**
  - Place reorders for low-stock items
  - Mark reorders as received
- 🗄 **Database Integration**
  - Uses MySQL with PyMySQL for storage
  - Advanced SQL: tables, views, stored procedures, functions
- 🎨 **Frontend**
  - HTML, CSS, JavaScript UI
  - Interactive forms and searchable dropdowns

---

## 🛠 Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: FastAPI (Python)
- **Database**: MySQL (via PyMySQL)
- **Other Tools**: Pandas, SQLAlchemy

---

## 📂 Project Structure
```
project/
│── main.py              # FastAPI entry point
│── db_functions.py      # Database connection and queries
│── index.html           # Frontend page
│── script.js            # Frontend logic (API calls, UI)
│── style.css            # Frontend styles
│── requirements.txt     # Dependencies
│── README.md            # Project documentation
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Sushant2802/Inventory-Management-System.git
cd inventory-management-system
```

### 2️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

### 3️⃣ Setup Database
- Install MySQL and create a database (e.g., `inventory_db`).
- Update **db_functions.py** with your DB credentials:
  ```python
  connection = pymysql.connect(
      host="localhost",
      user="your_username",
      password="your_password",
      database="inventory_db"
  )
  ```
- Import your schema (tables for products, suppliers, reorders, sales).

### 4️⃣ Run the Backend
```bash
uvicorn main:app --reload
```
Backend will start at:  
👉 `http://127.0.0.1:8000`

### 5️⃣ Open Frontend
Open `index.html` in a browser.  
Make sure the backend is running so API requests succeed.

---

## 🔮 Future Enhancements
- ✅ User authentication & role-based access
- ✅ Export reports as PDF/Excel
- ✅ Email/SMS alerts for low stock
- ✅ Cloud deployment with Docker

---

## 👨‍💻 Author
Developed by **Sushant Mane** ✨  
Full-stack Inventory Management Project for interview & resume showcase.
