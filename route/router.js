const express = require('express');
const router = express.Router();
const signup = require('../controller/signup-login/signup');
const  authenticateToken  = require('../middleware/verifyApi');

router.get('/', (req, res) => {
  res.send('Home page work correctly');
});
router.post('/signup', signup.signup);
router.post('/login', signup.login);
router.get('/fetch_user',authenticateToken , signup.fetch_user);
router.get('/api/messages/:userId', signup.fetch_messages);


module.exports = router;
