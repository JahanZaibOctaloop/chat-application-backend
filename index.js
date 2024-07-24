const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Import your models and routes
const Message = require('./model/message');
const route = require('./route/router');

const allowedOrigins = [
    ' https://81b3-119-155-16-186.ngrok-free.app',
    'https://chat-application-azure-three.vercel.app',
];

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(express.json());
app.use('/', route);

// Socket.IO configuration
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    },
    handlePreflightRequest: (req, res) => {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': req.headers.origin,
            'Access-Control-Allow-Methods': 'GET,POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': true,
        });
        res.end();
    },
});

global.onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.on('error', (err) => {
        console.error('Socket encountered error:', err.message, 'Closing socket');
        socket.close();
    });

    socket.on('add-user', (userId) => {
        if (userId) {
            global.onlineUsers.set(userId, socket.id);
            console.log(`User added: ${userId} with socket ID: ${socket.id}`);
            console.log('Current online users:', Array.from(global.onlineUsers.entries()));
        }
    });

    socket.on('send-msg', async (data) => {
        const { from, to, msg } = data;
        console.log(`Message from ${from} to ${to}: ${msg}`);
        const sendUserSocket = global.onlineUsers.get(to);

        const newMessage = new Message({
            from,
            to,
            content: msg,
            type: 'text',
        });

        try {
            await newMessage.save();
            if (sendUserSocket) {
                io.to(sendUserSocket).emit('msg-receive', { from, content: msg, type: 'text' });
            }
        } catch (err) {
            console.error('Error saving message:', err.message);
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
            type,
        });

        try {
            await newMessage.save();
            if (sendUserSocket) {
                io.to(sendUserSocket).emit('receive-media', { from, fileBuffer: base64String, type });
            }
        } catch (err) {
            console.error('Error saving media message:', err.message);
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
    console.error('DB Connection Error:', err.message);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
