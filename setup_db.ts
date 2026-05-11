
import sqlite3 from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve('database.sqlite');
console.log('Database path:', dbPath);
const schemaPath = path.resolve('schema.sql');

if (fs.existsSync(dbPath)) {
    console.log('Deleting existing database...');
    fs.unlinkSync(dbPath);
}

const db = new sqlite3(dbPath);
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Applying schema...');
db.exec(schema);

console.log('Inserting default admin...');
const passwordHash = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);

console.log('Inserting default categories...');
const categories = ['Bags', 'Heels', 'Sneakers'];
const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
categories.forEach(name => insertCat.run(name));

console.log('Database created successfully!');
db.close();
