const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const Message = require('./model/message');
const route = require('./route/router');
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', route);
require('dotenv').config();


global.onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User added: ${userId} with socket ID: ${socket.id}`);
        console.log('Current online users:', Array.from(onlineUsers.entries()));
    });

    socket.on("send-msg", async (data) => {
        console.log(`Message from ${data.from} to ${data.to}: ${data.msg}`);
        const sendUserSocket = onlineUsers.get(data.to);
        console.log(`Recipient socket ID: ${sendUserSocket}`);

        const newMessage = new Message({
            from: data.from,
            to: data.to,
            content: data.msg,
        });

        try {
            await newMessage.save();
            if (sendUserSocket) {
                socket.to(sendUserSocket).emit("msg-receive", data.msg);
            }
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on("disconnect", () => {
        onlineUsers.forEach((value, key) => {
            if (value === socket.id) {
                onlineUsers.delete(key);
                console.log(`User disconnected: ${key}`);
            }
        });
        console.log('Current online users:', Array.from(onlineUsers.entries()));
    });
});

mongoose.connect(process.env.Mongo_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("DB Connection Successful");
}).catch((err) => {
    console.log(err.message);
});

server.listen(4000, () => {
    console.log('Server is running on port 4000');
});
