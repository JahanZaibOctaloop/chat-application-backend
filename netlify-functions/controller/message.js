const express = require('express');
const router = express.Router();
const Message = require('../model/message');

const getMessage = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { from: userId },
                { to: userId }
            ]
        }).sort({ createdAt: 1 });
        
        res.status(200).json({ messages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {getMessage};
