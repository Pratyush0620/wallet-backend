const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/db');

//Post a product or insert a product into the product table
router.post('/product', authenticate, (req, res) => {
    const { name, price, description } = req.body;
    db.query('insert into products (name, price, description) values(?,?,?)', [name, price, description], (err, result) => {
        res.status(201).json({ id: result.insertId, message: 'Product added' });
    });
});

//Handling Getting the details of all the products
router.get('/product', (req, res) => {
    db.query('select * from products', (err, rows) => {
        res.json(rows);
    });
});

//Handling the user buying a product
router.post('/buy', authenticate, (req, res) => {
    const user = req.user;
    const id = req.body.product_id;

    db.query('select * from products where id = ? ', [id], (err, result) => {
        if (result.length === 0) return res.status(400).json({ error: 'Invalid product' });

        const product = result[0];
        if (user.balance < product.price) return res.status(400).json({ error: 'Insufficient balance' });

        const newBal = user.balance - product.price;
        db.query('update users set balance = ? where id = ? ', [newBal, user.id]);
        db.query('insert into transactions(kind,amt,updated_bal,user_id) values(?,?,?,?)', ['debit', product.price, newBal, user.id]);
        res.json({ message: 'Product Purchased', balance: newBal });

    });
});
module.exports = router;