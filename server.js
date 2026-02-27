const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express();
app.use(cors({
  origin: '*',                    // Allow all for development (safe for now)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// REPLACE WITH YOUR ACTUAL MongoDB CONNECTION STRING
const MONGODB_URI = 'mongodb+srv://dominaltech_db_user:Lg0xFmCXBUWYnYbd@cluster0.vhpaw9n.mongodb.net/libasdb?appName=Cluster0';
const client = new MongoClient(MONGODB_URI);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('libasdb');
  }
  return db;
}

// 🔄 PRODUCTS API (Admin + User site)
app.get('/api/products', async (req, res) => {
  try {
    const db = await connectDB();
    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 1 : -1;
    const products = await db.collection('products').find({}).sort({ [sort]: order }).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🖼️ BANNERS API (Homepage slider)
app.get('/api/banners', async (req, res) => {
  try {
    const db = await connectDB();
    const banners = await db.collection('bannerimages').find({}).sort({ sortorder: 1 }).toArray();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔐 THAAN CONFIG API (Password protection)
app.get('/api/thaanconfig', async (req, res) => {
  try {
    const db = await connectDB();
    const config = await db.collection('thaanconfig').findOne({});
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ADMIN CRUD (Add/Edit/Delete Products)
app.post('/api/products', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('products').insertOne({
      ...req.body,
      created_at: new Date()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updated_at: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔐 THAAN PASSWORD VERIFY
app.post('/api/thaanverify', async (req, res) => {
  try {
    const { password } = req.body;
    const db = await connectDB();
    const config = await db.collection('thaanconfig').findOne({});
    res.json({ success: config?.password === password });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Libas API running on port ${PORT}`);
});

