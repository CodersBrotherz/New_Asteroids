const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://127.0.0.1:5500",  // replace with your client's origin
        methods: ["GET", "POST"]
    }
});
class Player {
    constructor(socket) {
        this.socket = socket;
        this.hosting = false;
        this.room = null;
    }
    setRoom(roomId) {
        this.room = roomId;
    }
    removeRoom() {
        this.room = null;
    }
    getRoom() {
        return this.room;
    }
    getSocket() {
        return this.socket;
    }
    setHosting(val) {
        this.hosting = val;
    }
    isHosting() {
        return this.hosting;
    }
}
class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
    }
}
class ConnectionHandler {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(roomId) {
        if (!this.rooms.has(roomId))
            this.rooms.set(roomId, new Room(roomId));
    }
    removeRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).players.map(p => p.removeRoom())
            this.rooms.delete(roomId);
        }
    }
    getRoom(roomId) {
        return this.rooms.has(roomId) ? this.rooms.get(roomId) : null;
    }
    addPlayerToRoom(player, roomId) {
        if (!this.rooms.has(roomId)) {
            this.createRoom(roomId);
        }
        player.setRoom(roomId);
        const room = this.rooms.get(roomId);
        room.players.push(player);
        this.rooms.set(roomId, room);
    }
    removePlayerFromRoom(player, roomId) {
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.players = room.player.filter(p => p !== player);
            this.rooms.set(roomId, room);
        }
    }
}
const conn = new ConnectionHandler();
io.on('connection', (socket) => {
    const player = new Player(socket.id);
    socket.on('host-game', (roomId) => {
        player.setHosting(true);
        conn.addPlayerToRoom(player, roomId);
        socket.join(roomId);
    });
    socket.on('join-game', (data) => {
        const { roomId, info } = data;
        conn.addPlayerToRoom(player, roomId);
        socket.join(roomId);
        socket.to(roomId).emit('player-joined', info);
    });
    socket.on('move', (info) => {
        if (player.getRoom())
            socket.to(player.getRoom()).emit('player-moving', info);
    });
    socket.on('update-asteroids', (data) => socket.to(player.getRoom()).emit('update-asteroids', data));
    socket.on('disconnect', () => {
        socket.to(player.getRoom()).emit("player-left");
        if (player.isHosting())
            conn.removeRoom(player.getRoom());
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});