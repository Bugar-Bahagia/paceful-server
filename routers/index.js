const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));

router.use(require('../middleware/Authentication'));
router.use('/gemini', require('./gemini'));
router.use('/activities', require('./activities'));
router.use('/goals', require('./goals'));
router.use('/users', require('./users'));

module.exports = router;
