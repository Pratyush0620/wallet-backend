const express=require('express');
const dotenv=require('dotenv');
dotenv.config();

const authRoutes=require('./routes/auth');
const walletRoutes=require('./routes/wallet');
const productRoutes=require('./routes/product');

const app=express();
app.use(express.json());

app.use('/', authRoutes);
app.use('/', walletRoutes);
app.use('/', productRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});