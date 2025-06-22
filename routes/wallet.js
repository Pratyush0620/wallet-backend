const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/db');
const axios = require('axios');

//Adding funds to the account
router.post('/fund', authenticate, (req, res) => {
    const amt = req.body.amt;
    const user = req.user;

    const newBal = user.balance + amt;
    db.query('update users set balance = ? where id = ? ', [newBal, user.id]);
    db.query('insert into transactions (kind,amt,updated_bal,user_id) values (?,?,?,?) ', ['credit', amt, newBal, user.id]);
    res.json({ balance: newBal });
});

//Payments to another user
router.post('/pay', authenticate, (req, res) => {
    const { to, amt } = req.body;
    const sender = req.user;

    db.query('select * from users where username = ? ', [to], (err, result) => {
        if (err || result.length === 0) return res.status(400).json({ error: 'Recipient not found' });

        const reciever = result[0];
        if (sender.balance < amt) return res.status(400).json({ error: 'Insufficient funds' });

        const senderBal = sender.balance - amt;
        const recieverBal = reciever.balance + amt;

        db.query('update users set balance = ? where id = ? ', [senderBal, sender.id]);
        db.query('update users set balance = ? where id = ? ', [recieverBal, reciever.id]);
        db.query('INSERT INTO transactions (kind, amt, updated_bal, user_id) VALUES (?, ?, ?, ?)', ['debit', amt, senderBal, sender.id]);
        db.query('INSERT INTO transactions (kind, amt, updated_bal, user_id) VALUES (?, ?, ?, ?)', ['credit', amt, recieverBal, reciever.id]);

        res.json({ balance: senderBal });
    });
});

//Getting the balance of the user
router.get('/bal', authenticate, async (req, res) => {
    const currency = req.query.currency || 'INR'; //Either given currency or default INR
    const user = req.user;

    if (currency === 'INR') return res.json({ balance: user.balance, currency: 'INR' });

    try {
        const url = `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCY_API_KEY}&base_currency=INR`;
        const response = await axios.get(url);
        const rate = response.data.data[currency].value;
        const converted = (user.balance * rate).toFixed(2);
        res.json({ balance: parseFloat(converted), currency });
    } catch {
        res.status(400).json({ error: 'Conversion Failed' });
    }
});

//Getting the details of a user
router.get('/stmt', authenticate, (req, res) => {
    db.query('select kind,amt,updated_bal,timestamp from transactions where user_id = ? order by timestamp desc', [req.user.id], (err, rows) => {
        res.json(rows);
    });
});

module.exports = router;