const UserController = require('../controllers/userController');
const UserProfileController = require('../controllers/UserProfileController');
const authentication = require('../middleware/authentication');
const guardProfile = require(`../middleware/guardProfile`);


const router = require('express').Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/googlelogin', UserController.googleLogin);

router.use(authentication);
router.use(guardProfile)
router.post('/profile', UserProfileController.updateProfile);

module.exports = router;
