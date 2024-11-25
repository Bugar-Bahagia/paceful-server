if (process.env.NODE_ENV != 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const app = express();
const UserRouter = require('./routers/userRouter');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cors());

app.use(require('./routers'));

app.use('/user', UserRouter);


module.exports = app;
