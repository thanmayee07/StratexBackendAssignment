const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cz8fqgPzTP5XSehN23iaqQaj4ib+YbxzqhatZEtyUPE=';

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Upload setup
const upload = multer({ dest: 'uploads/' });

// User registration
app.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role
    }
  });
  res.json(user);
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({ token });
});

// CSV upload and parse
app.post('/books/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'SELLER') return res.sendStatus(403);

  const { file } = req;
  const books = [];
  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (row) => {
      books.push({
        title: row.title,
        author: row.author,
        publishedDate: new Date(row.publishedDate),
        price: parseFloat(row.price),
        sellerId: req.user.id
      });
    })
    .on('end', async () => {
      await prisma.book.createMany({ data: books });
      fs.unlinkSync(file.path); // remove temp file
      res.json({ message: 'Books uploaded successfully', books });
    });
});

// View, Edit, Delete Books
app.get('/books', async (req, res) => {
  const books = await prisma.book.findMany();
  res.json(books);
});

app.get('/books/:id', async (req, res) => {
  const { id } = req.params;
  const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.put('/books/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, publishedDate, price } = req.body;

  const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
  if (!book || book.sellerId !== req.user.id) return res.sendStatus(403);

  const updatedBook = await prisma.book.update({
    where: { id: parseInt(id) },
    data: { title, author, publishedDate: new Date(publishedDate), price: parseFloat(price) }
  });
  res.json(updatedBook);
});

app.delete('/books/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
  if (!book || book.sellerId !== req.user.id) return res.sendStatus(403);

  await prisma.book.delete({ where: { id: parseInt(id) } });
  res.json({ message: 'Book deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
