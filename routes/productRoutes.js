const express = require('express');
const router = express.Router();
const db = require('../config/db');

/* ================= STORE PAGE ================= */

router.get('/store', (req, res) => {
    db.query("SELECT * FROM products", (err, products) => {
        res.render('store', { products });
    });
});

/* ================= ADD PRODUCT ================= */

router.get('/add-product', (req, res) => {
    res.render('addProduct');
});

router.post('/add-product', (req, res) => {
    const { product_name, description, price, quantity } = req.body;

    db.query(
        "INSERT INTO products (product_name,description,price,quantity) VALUES (?,?,?,?)",
        [product_name, description, price, quantity],
        () => res.redirect('/admin/dashboard')
    );
});

/* ================= DELETE PRODUCT ================= */

router.get('/delete-product/:id', (req, res) => {
    db.query(
        "DELETE FROM products WHERE product_id=?",
        [req.params.id],
        () => res.redirect('/admin/dashboard')
    );
});

/* ================= MULTIPLE PRODUCT ORDER ================= */

router.post('/confirm-multiple-order', (req, res) => {

    const userId = req.session.userId;

    if (!req.body.products) {
        return res.send("Please select at least one product.");
    }

    let selectedProducts = req.body.products;

    // If only one checkbox selected, convert to array
    if (!Array.isArray(selectedProducts)) {
        selectedProducts = [selectedProducts];
    }

    const orderDate = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(orderDate.getDate() + 5);

    let totalAmount = 0;

    // First calculate total amount
    db.query(
        "SELECT * FROM products WHERE product_id IN (?)",
        [selectedProducts],
        (err, products) => {

            products.forEach(product => {
                const qty = parseInt(req.body[`quantity_${product.product_id}`]) || 1;
                totalAmount += product.price * qty;
            });

            // Insert into orders table
            db.query(
                "INSERT INTO orders (user_id,order_date,delivery_date,total_amount,payment_method) VALUES (?,?,?,?,?)",
                [userId, orderDate, deliveryDate, totalAmount, "Cash on Delivery"],
                (err, orderResult) => {

                    const orderId = orderResult.insertId;

                    // Insert each product into order_items
                    products.forEach(product => {

                        const qty = parseInt(req.body[`quantity_${product.product_id}`]) || 1;

                        db.query(
                            "INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)",
                            [orderId, product.product_id, qty, product.price]
                        );

                        // Reduce stock
                        db.query(
                            "UPDATE products SET quantity = quantity - ? WHERE product_id = ?",
                            [qty, product.product_id]
                        );
                    });

                    res.render('thankyou');
                }
            );
        }
    );
});

module.exports = router;
