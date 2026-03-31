import bcrypt from "bcryptjs";

export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin','viewer')) DEFAULT 'viewer',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      channel TEXT NOT NULL,
      budget REAL NOT NULL,
      expected_conversions INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      spend REAL DEFAULT 0,
      source_id TEXT UNIQUE NOT NULL,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      email TEXT,
      phone TEXT,
      source_id TEXT UNIQUE NOT NULL,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      phone TEXT,
      revenue REAL DEFAULT 0,
      attributed_campaign_id INTEGER,
      source_id TEXT UNIQUE NOT NULL,
      FOREIGN KEY(attributed_campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
    );
  `);

  seedUsers(db);
}

function seedUsers(db) {
  const existing = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (existing.count > 0) return;

  const adminHash = bcrypt.hashSync("admin123", 10);
  const viewerHash = bcrypt.hashSync("viewer123", 10);

  db.prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`).run(
    "admin@dashboard.com",
    adminHash,
    "admin",
  );

  db.prepare(`INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`).run(
    "viewer@dashboard.com",
    viewerHash,
    "viewer",
  );
}
