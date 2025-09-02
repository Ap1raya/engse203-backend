// server.js (ฉบับอัปเกรด)
const express = require('express');
const http = require('http'); // << Import http ของ Node
const { Server } = require("socket.io"); // << Import Server จาก socket.io
require('dotenv').config();

const app = express();
const server = http.createServer(app); // << สร้าง server ด้วย http
const io = new Server(server, { // << ผูก socket.io กับ http server
    cors: { origin: "*" } // อนุญาตการเชื่อมต่อจากทุกที่
});

const PORT = process.env.PORT || 3001;

// เสิร์ฟไฟล์ HTML สำหรับ Client
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// จัดการ Event เมื่อมีคนเชื่อมต่อเข้ามา
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // เมื่อได้รับ event 'chat message' จาก client
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        // ส่ง event 'chat message' กลับไปให้ client ทุกคนที่เชื่อมต่ออยู่
        io.emit('chat message', `[${socket.id} says]: ${msg}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server with WebSocket running on http://localhost:${PORT}`);
});