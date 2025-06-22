// const express=require('express');
// const router=express.Router();
// const auth=require('basic-auth');
// const bcrypt=require('bcrypt');
// const db=require('../config/db');


// //Registering the user part
// router.post('/register',async(req,res)=>{
//     const {username , password}=req.body;

//     if(!username || !password){
//         res.status(400).json({error:'Username and password required'});
//     }

//     try{
//         const hash=await bcrypt.hash(password,10);
//         db.query(
//             'insert into users(username ,password_hash) values(?,?)',
//             [username,hash],
//             (err,results)=>{
//                 if(err){
//                     if(err.code === 'ER_DUP_ENTRY'){
//                         return res.status(400).json({error:'User already exists'});
//                     }
//                     return res.status(500).json({error:'Database error'});
//                 }
//                 res.status(201).json({ message: 'User registered successfully' });
//             }
//         );
//     } catch(err){
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


// //Authenticate their identity through hashing their passwords using bcrypt
// async function authenticate(req,res,next){
//     const user=auth(req);
//     if(!user || !user.name || !user.pass){
//         return res.status(401).json({error:'Missing auth'});
//     }

//     db.query('select * from users where username = ? ',[user.name],async(err,results)=>{
//         if (err || results.length === 0) return res.status(401).json({error:'User not found'});

//         const match=await bcrypt.compare(user.pass,results[0].password_hash);
//         if(!match) return res.status(401).json({error:'Invalid Credentials'});

//         req.user=results[0];
//         next();

//     });
// }
// module.exports = router;
// module.exports.authenticate = authenticate;


const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const db = require('../config/db');

//Register User
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hash],
            (err, results) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'User already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'User registered successfully' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Authenticate Middleware
async function authenticate(req, res, next) {
    const user = auth(req);
    if (!user || !user.name || !user.pass) {
        return res.status(401).json({ error: 'Missing auth' });
    }

    db.query('SELECT * FROM users WHERE username = ?', [user.name], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const match = await bcrypt.compare(user.pass, results[0].password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        req.user = results[0];
        next();
    });
}

module.exports = router;
module.exports.authenticate = authenticate;
