import express from 'express';
import sqlite3 from 'better-sqlite3';
import path from 'path';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: sqlite3.Database;

function initDb() {
  const dbPath = 'database.sqlite';
  try {
    db = new sqlite3(dbPath);
    // Test if the database is valid
    db.prepare('PRAGMA integrity_check').get();
  } catch (err) {
    console.error('Database corruption detected or failed to open. Recreating...', err);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    db = new sqlite3(dbPath);
  }

  // Initialize Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      attribute_value_id INTEGER,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (attribute_value_id) REFERENCES attribute_values (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'text',
      status TEXT DEFAULT 'enabled'
    );

    CREATE TABLE IF NOT EXISTS attribute_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attribute_id INTEGER,
      name TEXT NOT NULL,
      value TEXT,
      FOREIGN KEY (attribute_id) REFERENCES attributes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_attribute_values (
      product_id INTEGER,
      attribute_value_id INTEGER,
      PRIMARY KEY (product_id, attribute_value_id),
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (attribute_value_id) REFERENCES attribute_values (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      brand TEXT,
      price REAL NOT NULL,
      discount_price REAL,
      description TEXT,
      image_url TEXT,
      category_id INTEGER,
      colors TEXT,
      sizes TEXT,
      is_featured INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- 'percentage' or 'flat'
      value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_phone TEXT,
      total_amount REAL,
      coupon_code TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      product_name TEXT,
      quantity INTEGER,
      price REAL,
      selected_color TEXT,
      selected_size TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);
}

initDb();

// Alter table to add is_featured and discount_price if they don't exist
try {
  db.prepare('ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0').run();
} catch (e) {}

// Alter table to add coupon_code if it doesn't exist
try {
  db.prepare('ALTER TABLE orders ADD COLUMN coupon_code TEXT').run();
} catch (e) {}

// Alter table to add attribute_value_id to product_images if it doesn't exist
try {
  db.prepare('ALTER TABLE product_images ADD COLUMN attribute_value_id INTEGER').run();
} catch (e) {}

// Alter table to add slug to products if it doesn't exist
try {
  db.prepare('ALTER TABLE products ADD COLUMN slug TEXT').run();
} catch (e) {}

// Alter table to add brand to products if it doesn't exist
try {
  db.prepare('ALTER TABLE products ADD COLUMN brand TEXT').run();
} catch (e) {}

// Create unique index for slug
try {
  db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug)').run();
} catch (e) {}

// Helper to generate unique slug
const generateSlug = (name: string, id?: number) => {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let finalSlug = slug;
  let counter = 1;
  while (true) {
    const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug) as { id: number } | undefined;
    if (!existing || (id && existing.id === id)) break;
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  return finalSlug;
};

// Populate missing slugs
const productsWithoutSlug = db.prepare('SELECT id, name FROM products WHERE slug IS NULL').all() as { id: number, name: string }[];
if (productsWithoutSlug.length > 0) {
  const updateSlug = db.prepare('UPDATE products SET slug = ? WHERE id = ?');
  productsWithoutSlug.forEach(p => {
    updateSlug.run(generateSlug(p.name, p.id), p.id);
  });
}

// Insert default admin if not exists (password: admin123)
const adminExists = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
}

// Default Categories
const cats = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
if (cats.count === 0) {
  db.prepare('INSERT INTO categories (name) VALUES (?)').run('Bags');
  db.prepare('INSERT INTO categories (name) VALUES (?)').run('Heels');
  db.prepare('INSERT INTO categories (name) VALUES (?)').run('Sneakers');
  
  // Default Attributes
  const colorAttr = db.prepare('INSERT INTO attributes (name, type) VALUES (?, ?)').run('Color', 'color');
  const sizeAttr = db.prepare('INSERT INTO attributes (name, type) VALUES (?, ?)').run('Size', 'text');

  const colorId = colorAttr.lastInsertRowid;
  const sizeId = sizeAttr.lastInsertRowid;

  // Default Values
  const insertVal = db.prepare('INSERT INTO attribute_values (attribute_id, name, value) VALUES (?, ?, ?)');
  insertVal.run(colorId, 'Red', '#FF0000');
  insertVal.run(colorId, 'Black', '#000000');
  insertVal.run(colorId, 'White', '#FFFFFF');

  insertVal.run(sizeId, 'Small', 'S');
  insertVal.run(sizeId, 'Medium', 'M');
  insertVal.run(sizeId, 'Large', 'L');

  // Sample Products
  const sampleProducts = [
    // Featured (10)
    { name: 'The Luxe Tote', price: 55000, category_id: 1, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800', description: 'Premium leather tote for everyday elegance.' },
    { name: 'Midnight Stiletto', price: 78000, category_id: 2, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1596702994270-9c2da5b3ede3?q=80&w=800', description: 'Graceful stiletto with a modern silhouette.' },
    { name: 'AeroLux Runner', price: 28000, category_id: 3, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800', description: 'Featherweight sneakers for peak performance.' },
    { name: 'Gold Petal Clutch', price: 42000, category_id: 1, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fd111c36?q=80&w=800', description: 'Delicate evening clutch with gold detailing.' },
    { name: 'Glass Pump', price: 95000, category_id: 2, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800', description: 'Crystal-clear heel for a Cinderella moment.' },
    { name: 'Street Pulse Sneaker', price: 19500, category_id: 3, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800', description: 'Bold urban design with maximum comfort.' },
    { name: 'Noir Crossbody', price: 35000, category_id: 1, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800', description: 'Versatile black leather crossbody bag.' },
    { name: 'Velvet Night Heel', price: 64000, category_id: 2, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1581101767113-1677fe2bd35e?q=80&w=800', description: 'Plush velvet wrap-around stiletto.' },
    { name: 'CloudWalk Trainer', price: 24000, category_id: 3, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800', description: 'Breathable mesh trainer for all-day wear.' },
    { name: 'Sienna Bucket Bag', price: 49000, category_id: 1, is_featured: 1, image_url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800', description: 'Handcrafted bucket bag in warm sienna.' },
    
    // Standard (10)
    { name: 'Classic Satchel', price: 38000, category_id: 1, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1598333126207-d90abf6f4770?q=80&w=800', description: 'Timeless satchel for your professional needs.' },
    { name: 'Elegance Wedge', price: 31000, category_id: 2, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1562273103-9197403948fb?q=80&w=800', description: 'Comfortable wedge for all-day sophistication.' },
    { name: 'Tempo High Top', price: 17000, category_id: 3, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800', description: 'Retro high-top sneaker with a modern twist.' },
    { name: 'Pearl Evening Bag', price: 29000, category_id: 1, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1614179677232-25459344405d?q=80&w=800', description: 'Shimmering pearls on a compact mini bag.' },
    { name: 'Suede Ankle Boot', price: 44000, category_id: 2, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?q=80&w=800', description: 'Soft suede boot with a stacked heel.' },
    { name: 'Vibe Mesh Sneaker', price: 15500, category_id: 3, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800', description: 'Colorful mesh design for casual vibes.' },
    { name: 'Quilted Mini Bag', price: 26000, category_id: 1, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1583623733237-4d5764a9dc82?q=80&w=800', description: 'Classic quilted pattern in soft lambskin.' },
    { name: 'Darsy Flat', price: 19000, category_id: 2, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?q=80&w=800', description: 'Minimalist flats for effortless style.' },
    { name: 'Phantom Leather Sneaker', price: 22500, category_id: 3, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1512374382149-4332c6c021f1?q=80&w=800', description: 'Sleek all-black sneaker with premium leather.' },
    { name: 'Canvas Weekender', price: 34000, category_id: 1, is_featured: 0, image_url: 'https://images.unsplash.com/photo-1544816153-16ad4614ff28?q=80&w=800', description: 'Spacious canvas bag for your quick getaways.' }
  ];

  const insertProduct = db.prepare('INSERT INTO products (name, price, category_id, image_url, description, is_featured) VALUES (?, ?, ?, ?, ?, ?)');
  sampleProducts.forEach(p => insertProduct.run(p.name, p.price, p.category_id, p.image_url, p.description, p.is_featured));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Multer Storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // Admin Middleware
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.cookies.admin_session === 'authenticated') {
      next();
    } else {
      res.status(403).json({ error: 'Unauthorized' });
    }
  };

  // API Routes
  app.get('/api/products', (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all() as any[];

    const enhancedProducts = products.map(product => {
      const attributeValues = db.prepare(`
        SELECT av.*, a.name as attribute_name, a.type as attribute_type
        FROM attribute_values av
        JOIN product_attribute_values pav ON av.id = pav.attribute_value_id
        JOIN attributes a ON av.attribute_id = a.id
        WHERE pav.product_id = ?
      `).all(product.id);
      
      const images = db.prepare(`
        SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC
      `).all(product.id);

      return { ...product, attribute_values: attributeValues, images };
    });
    res.json(enhancedProducts);
  });

  app.get('/api/products/slug/:slug', (req, res) => {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `).get(req.params.slug) as any;

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const attributeValues = db.prepare(`
      SELECT av.*, a.name as attribute_name, a.type as attribute_type
      FROM attribute_values av
      JOIN product_attribute_values pav ON av.id = pav.attribute_value_id
      JOIN attributes a ON av.attribute_id = a.id
      WHERE pav.product_id = ?
    `).all(product.id);
    
    const images = db.prepare(`
      SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC
    `).all(product.id);

    res.json({ ...product, attribute_values: attributeValues, images });
  });

  app.get('/api/categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    res.json(categories);
  });

  // Attribute Routes
  app.get('/api/attributes', (req, res) => {
    const attributes = db.prepare('SELECT * FROM attributes').all() as any[];
    const enhancedAttributes = attributes.map(attr => {
      const values = db.prepare('SELECT * FROM attribute_values WHERE attribute_id = ?').all(attr.id);
      return { ...attr, values };
    });
    res.json(enhancedAttributes);
  });

  app.post('/api/admin/attributes', isAdmin, (req, res) => {
    const { name, type } = req.body;
    try {
      const info = db.prepare('INSERT INTO attributes (name, type) VALUES (?, ?)').run(name, type || 'text');
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/admin/attributes/:id', isAdmin, (req, res) => {
    const { name, type, status } = req.body;
    db.prepare('UPDATE attributes SET name = ?, type = ?, status = ? WHERE id = ?').run(name, type, status || 'enabled', req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/attributes/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM attributes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Attribute Value Routes
  app.get('/api/attributes/:id/values', (req, res) => {
    const values = db.prepare('SELECT * FROM attribute_values WHERE attribute_id = ?').all(req.params.id);
    res.json(values);
  });

  app.post('/api/admin/attribute-values', isAdmin, (req, res) => {
    const { attribute_id, name, value } = req.body;
    const info = db.prepare('INSERT INTO attribute_values (attribute_id, name, value) VALUES (?, ?, ?)').run(attribute_id, name, value);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/admin/attribute-values/:id', isAdmin, (req, res) => {
    const { name, value } = req.body;
    db.prepare('UPDATE attribute_values SET name = ?, value = ? WHERE id = ?').run(name, value, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/attribute-values/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM attribute_values WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/admin/categories', isAdmin, (req, res) => {
    const { name } = req.body;
    const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/admin/categories/:id', isAdmin, (req, res) => {
    const { name } = req.body;
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/categories/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Settings Routes
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const config = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
    res.json(config);
  });

  app.post('/api/admin/settings', isAdmin, (req: any, res: any) => {
    const settings = req.body;
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        const val = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
        upsert.run(key, val);
      }
    });
    transaction(settings);
    res.json({ success: true });
  });

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
    
    if (admin && bcrypt.compareSync(password, admin.password_hash)) {
      // Use SameSite=None and Secure for iframe support in AI Studio
      res.cookie('admin_session', 'authenticated', { 
        httpOnly: true, 
        maxAge: 3600000,
        sameSite: 'none',
        secure: true
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_session', { sameSite: 'none', secure: true });
    res.json({ success: true });
  });

  app.get('/api/admin/check-session', (req, res) => {
    if (req.cookies.admin_session === 'authenticated') {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.post('/api/admin/products', isAdmin, upload.array('images', 5), (req, res) => {
    const { name, brand, price, discount_price, description, category_id, is_featured, attribute_value_ids, new_images_metadata } = req.body;
    const featured = is_featured === 'true' || is_featured === '1' ? 1 : 0;
    
    const transaction = db.transaction(() => {
      const files = req.files as Express.Multer.File[];
      const firstImg = files && files.length > 0 ? `/uploads/${files[0].filename}` : '/placeholder.jpg';
      const metadata = new_images_metadata ? JSON.parse(new_images_metadata) : [];
      const slug = generateSlug(name);

      const info = db.prepare(`
        INSERT INTO products (name, slug, brand, price, discount_price, description, image_url, category_id, is_featured) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, slug, brand || null, price, discount_price || null, description, firstImg, category_id, featured);
      
      const productId = info.lastInsertRowid;

      // Handle Gallery Images
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, attribute_value_id) VALUES (?, ?, ?, ?)');
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const meta = metadata[index] || {};
          insertImg.run(productId, `/uploads/${file.filename}`, (index === 0 ? 1 : 0), meta.attribute_value_id || null);
        });
      }

      if (attribute_value_ids) {
        const ids = Array.isArray(attribute_value_ids) ? attribute_value_ids : JSON.parse(attribute_value_ids);
        const insertAttr = db.prepare('INSERT INTO product_attribute_values (product_id, attribute_value_id) VALUES (?, ?)');
        ids.forEach((valId: any) => insertAttr.run(productId, valId));
      }
      return productId;
    });

    const id = transaction();
    res.json({ id });
  });

  app.put('/api/admin/products/:id', isAdmin, upload.array('images', 5), (req, res) => {
    const { name, brand, slug: customSlug, price, discount_price, description, category_id, is_featured, attribute_value_ids, existing_images, new_images_metadata } = req.body;
    const featured = is_featured === 'true' || is_featured === '1' ? 1 : 0;
    
    const transaction = db.transaction(() => {
      const files = req.files as Express.Multer.File[];
      const existing = existing_images ? JSON.parse(existing_images) : [];
      const newMetadata = new_images_metadata ? JSON.parse(new_images_metadata) : [];
      const slug = customSlug || generateSlug(name, Number(req.params.id));
      
      // Get the effective main image
      let mainImg = '/placeholder.jpg';
      if (existing.length > 0) mainImg = existing[0].image_url;
      if (files && files.length > 0) mainImg = `/uploads/${files[0].filename}`;

      db.prepare(`
        UPDATE products 
        SET name = ?, slug = ?, brand = ?, price = ?, discount_price = ?, description = ?, image_url = ?, category_id = ?, is_featured = ?
        WHERE id = ?
      `).run(name, slug, brand || null, price, discount_price || null, description, mainImg, category_id, featured, req.params.id);

      // Handle Gallery Updates
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(req.params.id);
      
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, attribute_value_id) VALUES (?, ?, ?, ?)');
      
      // Re-add existing images
      existing.forEach((img: any, index: number) => {
        insertImg.run(req.params.id, img.image_url, (index === 0 && files.length === 0) ? 1 : 0, img.attribute_value_id || null);
      });

      // Add new images
      if (files) {
        files.forEach((file, index) => {
          const meta = newMetadata[index] || {};
          insertImg.run(req.params.id, `/uploads/${file.filename}`, (index === 0 && existing.length === 0) ? 1 : 0, meta.attribute_value_id || null);
        });
      }

      db.prepare('DELETE FROM product_attribute_values WHERE product_id = ?').run(req.params.id);

      if (attribute_value_ids) {
        const ids = Array.isArray(attribute_value_ids) ? attribute_value_ids : JSON.parse(attribute_value_ids);
        const insertAttr = db.prepare('INSERT INTO product_attribute_values (product_id, attribute_value_id) VALUES (?, ?)');
        ids.forEach((valId: any) => insertAttr.run(req.params.id, valId));
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.delete('/api/admin/products/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Coupon Routes
  app.get('/api/admin/coupons', isAdmin, (req, res) => {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    res.json(coupons);
  });

  app.post('/api/admin/coupons', isAdmin, (req, res) => {
    const { code, type, value, min_amount } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO coupons (code, type, value, min_amount) 
        VALUES (?, ?, ?, ?)
      `).run(code.toUpperCase(), type, value, min_amount || 0);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: 'Coupon code already exists' });
    }
  });

  app.delete('/api/admin/coupons/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/coupons/validate/:code', (req, res) => {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(req.params.code.toUpperCase()) as any;
    if (coupon) {
      res.json(coupon);
    } else {
      res.status(404).json({ error: 'Invalid or expired coupon' });
    }
  });

  // Order Routes
  app.post('/api/orders', (req, res) => {
    const { customer_name, customer_phone, total_amount, items, coupon_code } = req.body;
    
    const transaction = db.transaction(() => {
      const orderInfo = db.prepare(`
        INSERT INTO orders (customer_name, customer_phone, total_amount, coupon_code) 
        VALUES (?, ?, ?, ?)
      `).run(customer_name, customer_phone, total_amount, coupon_code || null);
      
      const orderId = orderInfo.lastInsertRowid;
      
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, selected_color, selected_size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      items.forEach(item => {
        insertItem.run(
          orderId, 
          item.id, 
          item.name, 
          item.quantity, 
          item.price, 
          item.selectedColor || null, 
          item.selectedSize || null
        );
      });
      
      return orderId;
    });
    
    const id = transaction();
    res.json({ success: true, orderId: id });
  });

  app.get('/api/admin/orders', isAdmin, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
    const enhancedOrders = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items, order_id_formatted: `FP-${order.id.toString().padStart(4, '0')}` };
    });
    res.json(enhancedOrders);
  });

  app.get('/api/admin/search', isAdmin, (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json({ products: [], orders: [] });

    const searchTerm = `%${query}%`;
    const numericQuery = query.replace(/\D/g, '');

    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.slug LIKE ? OR p.id = ?
    `).all(searchTerm, searchTerm, numericQuery || -1);

    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE customer_name LIKE ? OR customer_phone LIKE ? OR id = ?
    `).all(searchTerm, searchTerm, numericQuery || -1) as any[];

    const enhancedOrders = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items, order_id_formatted: `FP-${order.id.toString().padStart(4, '0')}` };
    });

    res.json({ products, orders: enhancedOrders });
  });

  app.patch('/api/admin/orders/:id/status', isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  app.patch('/api/admin/orders/:id/customer', isAdmin, (req, res) => {
    const { customer_name, customer_phone } = req.body;
    db.prepare('UPDATE orders SET customer_name = ?, customer_phone = ? WHERE id = ?').run(customer_name, customer_phone, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/orders/:id', isAdmin, (req, res) => {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
      db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    });
    transaction();
    res.json({ success: true });
  });

  app.get('/api/admin/stats', isAdmin, (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'paid' OR status = 'processed'").get() as any;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as any;
    const rejectedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'").get() as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
    
    // Last 30 days daily sales
    const dailySales = db.prepare(`
      SELECT DATE(created_at) as date, SUM(total_amount) as total 
      FROM orders 
      WHERE (status = 'paid' OR status = 'processed') 
      AND created_at > DATETIME('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    res.json({
      revenue: totalSales.total || 0,
      pending: pendingOrders.count || 0,
      rejected: rejectedOrders.count || 0,
      totalOrders: totalOrders.count || 0,
      totalProducts: totalProducts.count || 0,
      dailySales
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite not found or failed to start, skipping Vite middleware.');
    }
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log('Production mode: Serving static files from', distPath);
    if (!fs.existsSync(distPath)) {
      console.error('CRITICAL: dist directory not found at', distPath);
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Site content not found. Please ensure the build completed successfully.');
      }
    });
  }

  // Global error handler for catching unhandled errors in routes
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server side error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Create uploads folder if not exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

startServer();
