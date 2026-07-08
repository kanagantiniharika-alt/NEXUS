import sqlite3
p = r'./database/aurorapro.db'
conn = sqlite3.connect(p)
c = conn.cursor()
try:
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print(c.fetchall())
except Exception as e:
    print(f"Error reading SQLite schema: {e}")
conn.close()
