require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (local or Atlas via .env)
const MONGODB_URI="mongodb+srv://lakshitaanbalagan6:quickinvoice@cluster0.vufwowm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(MONGODB_URI, {
useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log(`✅ MongoDB connected to ${MONGODB_URI.includes('localhost') ? 'Local DB' : 'Atlas DB'}`))
  .catch(err => console.log('❌ MongoDB connection error:', err));


// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  customerName: String,
  product: String,
  quantity: Number,
  price: Number,
  date: { type: Date, default: Date.now }
});
const Invoice = mongoose.model('Invoice', invoiceSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// JWT Secret Key
const JWT_SECRET = 'your_jwt_secret_key';  // Make sure to keep it secret

// Welcome Route
app.get('/users', (req, res) => {
  res.send('Welcome to the QuickInvoice API!');
});



// GET all invoices
app.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// POST new invoice
app.post('/invoices', async (req, res) => {
  const invoice = new Invoice(req.body);
  try {
    const saved = await invoice.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Error saving invoice' });
  }
});



app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const contact = new Contact({ name, email, message });
    await contact.save();
    res.status(200).json({ message: 'Message received successfully' });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ------------------ AUTH ROUTES ------------------

// Signup
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login - Generate JWT Token
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Protected Route (Admin Dashboard Example)
app.get('/dashboard', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: 'Welcome to the Admin Dashboard', user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ------------------ INVOICE DOWNLOAD ROUTE ------------------

app.get('/invoice/download/:id', async (req, res) => {
  const invoiceId = req.params.id;

  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${invoiceId}.pdf"`);

    doc.pipe(res);

    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Customer: ${invoice.customerName}`);
    doc.text(`Product: ${invoice.product}`);
    doc.text(`Quantity: ${invoice.quantity}`);
    doc.text(`Price: ₹${invoice.price}`);
    doc.text(`Total: ₹${invoice.quantity * invoice.price}`);
    doc.text(`Date: ${invoice.date.toLocaleDateString()}`);

    doc.end();
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ message: 'Error generating invoice' });
  }
});

// ------------------ SERVER START ------------------

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
