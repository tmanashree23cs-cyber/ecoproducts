const express = require('express');
const router = express.Router();
const db = require('../config/db');


// ================= WELCOME =================
router.get('/', (req, res) => {
    res.render('welcome');
});


// ================= REGISTER =================
router.get('/register', (req, res) => {
    res.render('userRegister');
});

router.post('/register', (req, res) => {

    const { name, email, phone, password, address } = req.body;

    const sql = "INSERT INTO users (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [name, email, phone, password, address], (err) => {
        if (err) {
            console.log(err);
            return res.send("Registration Failed");
        }
        res.redirect('/login');
    });
});


// ================= LOGIN =================
router.get('/login', (req, res) => {
    res.render('userLogin');
});

router.post('/login', (req, res) => {

    const { email, password } = req.body;

    const ADMIN_EMAIL = "admin@123";
    const ADMIN_PASSWORD = "123";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.admin = true;
        return res.redirect('/admin/dashboard');
    }

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {

        if (err) return res.send("Database Error");

        if (result.length > 0) {
            req.session.userId = result[0].user_id;
            return res.redirect('/store');
        }

        res.send("Invalid Credentials");
    });
});


// ================= LOGOUT =================
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});


// ================= STORE =================
router.get('/store', (req, res) => {

    if (!req.session.userId) return res.redirect('/login');

    db.query("SELECT * FROM products", (err, results) => {

        if (err) return res.send("Error loading products");

        res.render('store', { products: results });
    });
});


// ================= BUY =================
router.get('/buy/:id', (req, res) => {

    if (!req.session.userId) return res.redirect('/login');

    const productId = req.params.id;
    const quantity = parseInt(req.query.quantity);

    db.query("SELECT * FROM products WHERE product_id = ?", 
    [productId], (err, result) => {

        if (err || result.length === 0)
            return res.send("Product not found");

        const product = result[0];

        if (quantity > product.quantity)
            return res.send("Not enough stock available");

        res.render('billing', {
            product: product,
            quantity: quantity
        });
    });
});


// ================= CONFIRM ORDER =================
router.post('/confirm-order/:id', (req, res) => {

    if (!req.session.userId) return res.redirect('/login');

    const productId = req.params.id;
    const quantity = parseInt(req.body.quantity);

    db.query("SELECT price, quantity FROM products WHERE product_id = ?", 
    [productId], (err, result) => {

        if (err || result.length === 0)
            return res.send("Product not found");

        const product = result[0];

        if (quantity > product.quantity)
            return res.send("Not enough stock available");

        const totalAmount = product.price * quantity;

        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7);

        const orderSql = `
            INSERT INTO orders 
            (user_id, order_date, delivery_date, total_amount) 
            VALUES (?, NOW(), ?, ?)
        `;

        db.query(orderSql, 
        [req.session.userId, deliveryDate, totalAmount], 
        (err, orderResult) => {

            if (err) return res.send("Order Failed");

            const orderId = orderResult.insertId;

            const itemSql = `
                INSERT INTO order_items 
                (order_id, product_id, quantity) 
                VALUES (?, ?, ?)
            `;

            db.query(itemSql, 
            [orderId, productId, quantity], 
            (err) => {

                if (err) return res.send("Order Item Failed");

                const updateStockSql = `
                    UPDATE products 
                    SET quantity = quantity - ? 
                    WHERE product_id = ?
                `;

                db.query(updateStockSql, 
                [quantity, productId], 
                (err) => {

                    if (err) return res.send("Stock Update Failed");

                    // ✅ Redirect to Thank You page
                    res.redirect('/thankyou');
                });
            });
        });
    });
});


// ================= THANK YOU PAGE =================
router.get('/thankyou', (req, res) => {

    if (!req.session.userId) return res.redirect('/login');

    res.render('thankyou');
});


// ================= VIEW ORDERS =================
router.get('/orders', (req, res) => {

    if (!req.session.userId) return res.redirect('/login');

    const sql = `
        SELECT o.order_id,
               o.order_date,
               o.delivery_date,
               o.total_amount,
               p.product_name,
               oi.quantity
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = ?
        ORDER BY o.order_id DESC
    `;

    db.query(sql, [req.session.userId], (err, results) => {

        if (err) return res.send("Error fetching orders");

        res.render('orders', { orders: results });
    });
});

module.exports = router;
