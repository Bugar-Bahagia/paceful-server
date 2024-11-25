const express = require('express');
const router = express.Router();

router.use('/activities', require('./activities'));
router.use('/goals', require('./goals'));
router.use('/user', require('./user'));

module.exports = router;
