const User = require('../../model/user');
const Message = require('../../model/message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'default_secret_key';

const signup = async(req ,res)=>{
    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
  
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }
  
      user = new User({
        name,
        email,
        password,
      });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();
  
      res.send('User registered successfully');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }    
}

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user._id, name: user.name  }, secretKey, { expiresIn: '1h' });

      res.json({ message: 'Login Success', success: true, token:token, data:user });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
};

const fetch_user = async (req , res) => {
  const users = await User.find();
  if(users){
    res.json({
      message:'All user here',
      data:users
    })
  }else{
    res.json({
      message:'Error fetching the Users'
    })
  }

}

const fetch_messages = async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const messages = await Message.find({
        $or: [
            { from: userId, to: chatId },
            { from: chatId, to: userId }
        ]
    }).sort({ createdAt: 1 });
    
    res.status(200).json({ messages });
} catch (err) {
    res.status(500).json({ message: err.message });
}
};

module.exports = {
    signup,
    login,
    fetch_user,
    fetch_messages
}