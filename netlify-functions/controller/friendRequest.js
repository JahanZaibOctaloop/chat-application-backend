const express = require('express');
const FriendRequest = require('../model/friendRequest');
const User = require('../model/user');

    const all_user= async (req, res) => {
    try {
        const users = await User.find();
        res.json({ users });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};    




const fetchFriendRequests = async (req, res) => {
    try {
        const userId = req.userId; 

        const friendRequests = await FriendRequest.find({
            to: userId
        }).populate('from', 'name') 
          .populate('to', 'name'); 
        res.status(200).json({ friendRequests });
    } catch (err) {
        console.error('Error fetching friend requests:', err);
        res.status(500).json({ message: 'Failed to fetch friend requests' });
    }
};



const friend_requests_send = async (req, res) => {
    const { recipientId } = req.body;
    const senderId = req.userId;

    try {
        const existingRequest = await FriendRequest.findOne({ from: senderId, to: recipientId });

        if (existingRequest) {
            return res.status(400).json({ message: 'You have already sent a friend request to this user' });
        }

        const request = new FriendRequest({
            from: senderId,
            to: recipientId,
        });

        await request.save();
        res.status(200).json({ message: 'Friend request sent' });
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



const acceptFriendRequest = async (req, res) => {
    const { requestId } = req.params;
    try {
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        if (friendRequest.to.toString() !== req.userId) {
            return res.status(403).json({ message: 'You are not authorized to accept this request' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        const sender = await User.findById(friendRequest.from);
        const recipient = await User.findById(friendRequest.to);

        sender.friends.push(recipient._id);
        recipient.friends.push(sender._id);

        await sender.save();
        await recipient.save();

        res.status(200).json({ message: 'Friend request accepted', friendRequest });
    } catch (err) {
        console.error('Error accepting friend request:', err);
        res.status(500).json({ message: 'Failed to accept friend request' });
    }
};

const rejectFriendRequest = async (req, res) => {
    const { requestId } = req.params; // The ID of the request to reject

    try {
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        if (friendRequest.to.toString() !== req.userId) {
            return res.status(403).json({ message: 'You are not authorized to reject this request' });
        }

        friendRequest.status = 'rejected';
        await friendRequest.save();

        res.status(200).json({ message: 'Friend request rejected', friendRequest });
    } catch (err) {
        console.error('Error rejecting friend request:', err);
        res.status(500).json({ message: 'Failed to reject friend request' });
    }
};

getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('friends', 'name');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ friends: user.friends });
    } catch (err) {
        console.error('Error fetching friends:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



module.exports = {
    fetchFriendRequests,
    all_user,
    getFriends,
    friend_requests_send,
    acceptFriendRequest,
    rejectFriendRequest
};
