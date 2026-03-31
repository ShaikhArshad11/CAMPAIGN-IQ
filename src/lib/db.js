import Database from "better-sqlite3";
import path from "path";
import { runMigrations } from "./schema";

const DB_PATH = path.join(process.cwd(), "campaign.db");

const globalForDb = globalThis;

export function getDb() {
  if (!globalForDb.__campaignDb) {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    globalForDb.__campaignDb = db;
  }
  return globalForDb.__campaignDb;
}
