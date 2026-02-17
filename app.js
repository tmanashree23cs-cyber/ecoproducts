const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

/* ================= DATABASE CONNECTION ================= */

// ✅ Use db.js connection
const db = require('./db');

/* ================= MIDDLEWARE ================= */

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'ecoSecret',
    resave: false,
    saveUninitialized: true
}));

/* ================= ROUTES ================= */

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');

app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/', productRoutes);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
