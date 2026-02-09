"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = require("fs");
const path_1 = require("path");
const DB_PATH = process.env.DATABASE_URL || (0, path_1.join)(process.cwd(), 'data', 'socialpro.db');
// Ensure data directory exists
const fs_2 = require("fs");
try {
    (0, fs_2.mkdirSync)((0, path_1.join)(process.cwd(), 'data'), { recursive: true });
}
catch (e) { }
exports.db = new better_sqlite3_1.default(DB_PATH, { verbose: console.log });
// Initialize schema
const schema = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, 'schema.sql'), 'utf-8');
exports.db.exec(schema);
console.log('[DB] Database initialized at:', DB_PATH);
