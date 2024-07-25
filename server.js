const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

const Message = require('./model/message');
const route = require('./route/router');


app.use(cors({
    origin: 'https://chat-application-azure-three.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Add any other headers you need
    credentials: true,
}));

app.use(express.json());
app.use('/', route);

const io = new Server(server, {
    cors: {
        origin: 'https://chat-application-azure-three.vercel.app',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'], 
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});

global.onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('error', (err) => {
        console.error('Socket encountered error: ', err.message, 'Closing socket');
        socket.close();
    });

    socket.on('add-user', (userId) => {
        global.onlineUsers.set(userId, socket.id);
        console.log(`User added: ${userId} with socket ID: ${socket.id}`);
        console.log('Current online users:', Array.from(global.onlineUsers.entries()));
    });

    socket.on('send-msg', async (data) => {
        console.log(`Message from ${data.from} to ${data.to}: ${data.msg}`);
        const sendUserSocket = global.onlineUsers.get(data.to);
        console.log(`Recipient socket ID: ${sendUserSocket}`);

        const newMessage = new Message({
            from: data.from,
            to: data.to,
            content: data.msg,
            type: 'text',
        });

        try {
            await newMessage.save();
            if (sendUserSocket) {
                socket.to(sendUserSocket).emit('msg-receive', { from: data.from, content: data.msg, type: 'text' });
            }
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('send-media', async (data) => {
        const { recipientId, fileBuffer, from, type } = data;
        const sendUserSocket = global.onlineUsers.get(recipientId);

        const base64String = Buffer.from(fileBuffer).toString('base64');

        const newMessage = new Message({
            from,
            to: recipientId,
            content: base64String,
            type: type, 
        });

        try {
            await newMessage.save();
            if (sendUserSocket) {
                socket.to(sendUserSocket).emit('receive-media', { from, fileBuffer: base64String, type });
            }
        } catch (err) {
            console.error('Error saving media message:', err);
        }
    });

    socket.on('disconnect', () => {
        global.onlineUsers.forEach((value, key) => {
            if (value === socket.id) {
                global.onlineUsers.delete(key);
                console.log(`User disconnected: ${key}`);
            }
        });
        console.log('Current online users:', Array.from(global.onlineUsers.entries()));
    });
});

mongoose.connect(process.env.Mongo_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('DB Connection Successful');
}).catch((err) => {
    console.log('DB Connection Error:', err.message);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
