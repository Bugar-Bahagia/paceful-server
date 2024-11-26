
const UsersController = require('../controllers/UsersController')

const router = require('express').Router();

router.use(require('../middleware/guardProfile'))
router.put('/profile', UsersController.updateProfile);
router.get('/profile', UsersController.getProfile);
router.delete('/profile', UsersController.removeProfile);

module.exports = router;
