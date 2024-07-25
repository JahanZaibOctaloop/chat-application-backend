const express = require('express');
const router = express.Router();
const signup = require('../controller/signup-login/signup');
const  authenticateToken  = require('../middleware/verifyApi');
const friendRequest = require('../controller/friendRequest');

router.get('/', (req, res) => {
  res.send('Home page work correctly');
});
router.post('/signup', signup.signup);
router.post('/login', signup.login);

router.get('/fetch_user',authenticateToken , signup.fetch_user);
router.get('/api/friend-requests/friends', authenticateToken, friendRequest.getFriends);
router.get('/api/messages/:userId/:chatId', signup.fetch_messages);

// friendrequest route
router.get('/api/friend-requests', authenticateToken, friendRequest.fetchFriendRequests);
router.get('/api/users', friendRequest.all_user);
router.post('/api/friend-requests/send',authenticateToken, friendRequest.friend_requests_send);
router.post('/api/friend-requests/:requestId/accept', authenticateToken, friendRequest.acceptFriendRequest);
router.post('/api/friend-requests/:requestId/reject', authenticateToken, friendRequest.rejectFriendRequest);



module.exports = router;
