// Importación de módulos necesarios
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Configuración inicial del servidor
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://127.0.0.1:5500",  // Origen del cliente
        methods: ["GET", "POST"]          // Métodos permitidos
    }
});

/**
 * Clase que representa un jugador en el sistema
 * @class Player
 */
class Player {
    constructor(socketId) {
        this.socketId = socketId;
        this.hosting = false;    // Indica si el jugador es anfitrión
        this.room = null;        // Sala actual del jugador
    }

    removeRoom() {
        this.room = null;
    }

    isHosting() {
        return this.hosting;
    }

    set room(roomId) {
        this.room = roomId;
    }
    get room() {
        return this.room;
    }
    get socketId() {
        return this.socketId;
    }
    set hosting(val) {
        this.hosting = val;
    }
}

/**
 * Clase que representa una sala de juego
 * @class Room
 */
class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];       // Array de jugadores en la sala
    }
}

/**
 * Clase que maneja las conexiones y salas del juego
 * @class ConnectionHandler
 */
class ConnectionHandler {
    constructor() {
        this.rooms = new Map();      // Mapa de todas las salas
        this.players = new Map();    // Mapa de todos los jugadores
    }

    /**
     * Crea una nueva sala
     * @param {string} roomId - ID de la sala a crear
     */
    createRoom(roomId) {
        if (!this.rooms.has(roomId))
            this.rooms.set(roomId, new Room(roomId));
    }

    /**
     * Elimina una sala y libera a sus jugadores
     * @param {string} roomId - ID de la sala a eliminar
     */
    removeRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).players.forEach(p => p.removeRoom());
            this.rooms.delete(roomId);
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
     */
    addPlayerToRoom(player, roomId) {
        if (!this.rooms.has(roomId)) {
            this.createRoom(roomId);
        }
        player.room = roomId;
        const room = this.rooms.get(roomId);
        room.players.push(player);
        this.players.set(player.socketId, player);
        this.rooms.set(roomId, room);
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

// Configuración de eventos de Socket.IO
io.on('connection', (socket) => {
    // Crear nuevo jugador al conectarse
    const player = new Player(socket.id);

    // Evento para crear una sala como anfitrión
    socket.on('host-game', (roomId) => {
        player.setHosting(true);
        conn.addPlayerToRoom(player, roomId);
        socket.join(roomId);
    });

    // Evento para unirse a una sala existente
    socket.on('join-game', (data) => {
        const { roomId, info } = data;
        conn.addPlayerToRoom(player, roomId);
        socket.join(roomId);
        socket.to(roomId).emit('player-joined', info);
    });

    // Evento para actualizar movimiento del jugador
    socket.on('move', (info) => {
        if (player.room)
            socket.to(player.room).emit('player-moving', info);
    });

    // Evento para actualizar estado de asteroides
    socket.on('update-asteroids', (data) => {
        if (player.room) {
            socket.to(player.room).emit('update-asteroids', data);
        }
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
        const roomId = player.room;
        if (roomId) {
            socket.to(roomId).emit("player-left");
            if (player.isHosting())
                conn.removeRoom(roomId);
            else
                conn.removePlayerFromRoom(player, roomId);
        }
        console.log('Usuario desconectado');
    });
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});