const express = require('express');
const router = express.Router();
const db = require('../config/db');


// 🔐 Fixed Strong Admin Credentials
const ADMIN_EMAIL = "admin@123";
const ADMIN_PASSWORD = "123";


// ================= ADMIN LOGIN PAGE =================
router.get('/login', (req, res) => {
    res.render('adminLogin');
});


// ================= ADMIN LOGIN CHECK =================
router.post('/login', (req, res) => {

    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

        req.session.admin = true;
        res.redirect('/admin/dashboard');

    } else {
        res.send("Invalid Admin Credentials");
    }
});


// ================= ADMIN DASHBOARD =================
router.get('/dashboard', (req, res) => {

    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    db.query("SELECT * FROM products", (err, results) => {

        if (err) {
            console.log(err);
            return res.send("Error loading products");
        }

        res.render('adminDashboard', { products: results });
    });
});


// ================= ADD PRODUCT =================
router.post('/add-product', (req, res) => {

    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    const { product_name, price, quantity, description } = req.body;

    const sql = "INSERT INTO products (product_name, price, quantity, description) VALUES (?, ?, ?, ?)";

    db.query(sql, [product_name, price, quantity, description], (err) => {

        if (err) {
            console.log(err);
            return res.send("Error adding product");
        }

        res.redirect('/admin/dashboard');
    });
});


// ================= DELETE PRODUCT =================
router.get('/delete/:id', (req, res) => {

    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    db.query("DELETE FROM products WHERE product_id = ?", [req.params.id], (err) => {

        if (err) {
            return res.send("Error deleting product");
        }

        res.redirect('/admin/dashboard');
    });
});


// ================= ADMIN LOGOUT =================
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
