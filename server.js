// Importación de módulos necesarios
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Configuración inicial del servidor
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",  // Allow connections from any origin
        methods: ["GET", "POST"]
    }
});

/**
 * Clase que representa un jugador en el sistema
 * @class Player
 */
class Player {
    constructor(socketId) {
        this._socketId = socketId;
        this._hosting = false;
        this._room = null;
    }

    removeRoom() {
        this._room = null;
    }

    isHosting() {
        return this._hosting;
    }

    set room(roomId) {
        this._room = roomId;
    }
    
    get room() {
        return this._room;
    }
    
    get socketId() {
        return this._socketId;
    }
    
    set socketId(val) {
        this._socketId = val;
    }
    
    set hosting(val) {
        this._hosting = val;
    }
}

/**
 * Clase que representa una sala de juego
 * @class Room
 */
class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.bullets = [];
        this.asteroids = [];
    }
}

/**
 * Clase que maneja las conexiones y salas del juego
 * @class ConnectionHandler
 */
class ConnectionHandler {
    constructor() {
        this.rooms = new Map();
        this.players = new Map();
    }

    /**
     * Crea una nueva sala
     * @param {string} roomId - ID de la sala a crear
     */
    createRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Room(roomId));
            console.log(`Room created: ${roomId}`);
        }
    }

    /**
     * Elimina una sala y libera a sus jugadores
     * @param {string} roomId - ID de la sala a eliminar
     */
    removeRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).players.forEach(p => p.removeRoom());
            this.rooms.delete(roomId);
            console.log(`Room removed: ${roomId}`);
        }
    }

    /**
     * Obtiene una sala específica
     * @param {string} roomId - ID de la sala
     * @returns {Room|null} Sala encontrada o null
     */
    getRoom(roomId) {
        return this.rooms.has(roomId) ? this.rooms.get(roomId) : null;
    }

    /**
     * Añade un jugador a una sala
     * @param {Player} player - Jugador a añadir
     * @param {string} roomId - ID de la sala
     * @returns {boolean} - True if successfully added, false otherwise
     */
    addPlayerToRoom(player, roomId) {
        if (!this.rooms.has(roomId)) {
            this.createRoom(roomId);
        }
        
        const room = this.rooms.get(roomId);
        
        // Limit to 2 players per room
        if (room.players.length >= 2) {
            console.log(`Room ${roomId} is full, cannot add player ${player.socketId}`);
            return false;
        }
        
        player.room = roomId;
        room.players.push(player);
        this.players.set(player.socketId, player);
        this.rooms.set(roomId, room);
        console.log(`Player ${player.socketId} joined room ${roomId}`);
        return true;
    }

    /**
     * Elimina un jugador de una sala
     * @param {Player} player - Jugador a eliminar
     * @param {string} roomId - ID de la sala
     */
    removePlayerFromRoom(player, roomId) {
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.players = room.players.filter(p => p.socketId !== player.socketId);
            this.rooms.set(roomId, room);
            console.log(`Player ${player.socketId} left room ${roomId}`);
        }
        this.players.delete(player.socketId);
    }

    /**
     * Obtiene un jugador por su ID de socket
     * @param {string} socketId - ID del socket del jugador
     * @returns {Player|undefined} Jugador encontrado o undefined
     */
    getPlayerBySocketId(socketId) {
        return this.players.get(socketId);
    }
}

// Inicialización del manejador de conexiones
const conn = new ConnectionHandler();

// Generate a simple random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Configuración de eventos de Socket.IO
io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    // Crear nuevo jugador al conectarse
    const player = new Player(socket.id);

    // Event to request a new room ID
    socket.on('request-room-id', () => {
        const roomId = generateRoomId();
        socket.emit('room-id-generated', roomId);
        console.log(`Room ID generated for ${socket.id}: ${roomId}`);
    });

    // Evento para crear una sala como anfitrión
    socket.on('host-game', (roomId) => {
        player.hosting = true;
        const success = conn.addPlayerToRoom(player, roomId);
        socket.join(roomId);
        socket.emit('host-status', { success, roomId });
        console.log(`Player ${socket.id} is hosting room ${roomId}`);
    });

    // Evento para unirse a una sala existente
    socket.on('join-game', (data) => {
        const { roomId, info } = data;
        const room = conn.getRoom(roomId);
        
        if (!room) {
            socket.emit('join-status', { success: false, message: "Room not found" });
            return;
        }

        const success = conn.addPlayerToRoom(player, roomId);
        if (success) {
            socket.join(roomId);
            socket.emit('join-status', { success: true, roomId });
            socket.to(roomId).emit('player-joined', info);
        } else {
            socket.emit('join-status', { success: false, message: "Room is full" });
        }
    });

    // Evento para actualizar movimiento del jugador
    socket.on('move', (info) => {
        if (player.room) {
            socket.to(player.room).emit('player-moving', info);
        }
    });

    // Evento para actualizar estado de asteroides
    socket.on('update-asteroids', (data) => {
        if (player.room) {
            socket.to(player.room).emit('update-asteroids', data);
        }
    });

    // Event to handle bullet creation
    socket.on('shoot', (bulletData) => {
        if (player.room) {
            socket.to(player.room).emit('remote-shoot', bulletData);
        }
    });

    // Event to handle bullet collision/destruction
    socket.on('destroy-bullet', (bulletId) => {
        if (player.room) {
            socket.to(player.room).emit('bullet-destroyed', bulletId);
        }
    });
    
    // Event to handle asteroid destruction
    socket.on('destroy-asteroid', (asteroidId) => {
        if (player.room) {
            socket.to(player.room).emit('asteroid-destroyed', asteroidId);
        }
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
        const roomId = player.room;
        if (roomId) {
            socket.to(roomId).emit("player-left", player.socketId);
            if (player.isHosting()) {
                conn.removeRoom(roomId);
            } else {
                conn.removePlayerFromRoom(player, roomId);
            }
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});