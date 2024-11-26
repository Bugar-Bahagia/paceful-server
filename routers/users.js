
const UserProfileController = require('../controllers/UserProfileController');

const router = require('express').Router();

router.use(require('../middleware/guardProfile'))
router.put('/profile', UserProfileController.updateProfile);

module.exports = router;
