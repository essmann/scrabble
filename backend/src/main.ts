import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import express from "express";
import { userMiddleware } from './middleware.js';
import cookieParser from 'cookie-parser';
import http from 'http';
import { SECRET } from './middleware.js';
import { type SocketMessage } from './types/SocketMessage.js';
import { GameManager } from './gameManager.js';
import { RoomManager, type Room, type User } from './roomManager.js';
import { WebSocketManager, type AuthenticatedWebSocket } from './ws/websocketManager.js';
import { WSMessageHandler } from './ws/WSMessageHandler.js';
import { parseMessage, parseCookies } from './utils/index.js';
import { logger } from './logger.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const expressPort = 3000;


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(cookieParser());
app.use(express.json());
app.use(userMiddleware);


// ============================================================================
// TYPES
// ============================================================================

interface JwtPayloadCustom {
    userId: string;
    name: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

const decodeJwt = (token: string): JwtPayloadCustom => {
    return jwt.verify(token, SECRET) as JwtPayloadCustom;
}

// ============================================================================
// INSTANCES
// ============================================================================

export const roomManager = new RoomManager();
export const gameManager = new GameManager();

// ============================================================================
// WEBSOCKET CONNECTION HANDLER
// ============================================================================

const handleWebSocketConnection = (ws: AuthenticatedWebSocket, req: http.IncomingMessage) => {
    console.log("Client connected");

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.userToken;
    const ipAddress = req.socket.remoteAddress;

    if (!token) {
        console.log("Couldn't find the userToken on the cookie. Closing.");
        logger.logConnectionFailure({
            userId: 'unknown',
            success: false,
            reason: 'No token found',
            ipAddress
        });
        ws.close(1008, 'No token found');
        return;
    }

    try {
        const decoded = decodeJwt(token);
        const userId = decoded.userId;
        const userName = decoded.name;

        logger.logConnectionAttempt(userId, userName, ipAddress);
        console.log(`User ${userId} (${userName}) connected via WebSocket`);

        ws.userId = userId;
        WebSocketManager.addClient(userId, ws);

        logger.logConnectionSuccess({
            userId,
            userName,
            success: true,
            ipAddress
        });

        ws.on('message', (rawMessage) => {
            try {
                const msg = parseMessage(rawMessage);
                console.log('Received typed message:', msg);
                WSMessageHandler.handle(ws, msg);
            } catch (err) {
                console.error('Failed to handle message', err);
                logger.logError('MESSAGE_HANDLING', 'Failed to handle WebSocket message', err);
            }
        });

        ws.on('close', () => {
            if (ws.userId) {
                WebSocketManager.removeClient(ws.userId);
                console.log(`[WS] User ${ws.userId} disconnected, but room persists`);
                logger.logDisconnection(ws.userId, userName);
            }
        });

    } catch (error) {
        console.error("JWT verification failed:", error);
        logger.logConnectionFailure({
            userId: 'unknown',
            success: false,
            reason: 'Invalid token',
            ipAddress
        });
        logger.logError('JWT_VERIFICATION', 'JWT verification failed', error);
        ws.close(1008, 'Invalid token');
    }
};

wss.on('connection', handleWebSocketConnection);

// ============================================================================
// MIDDLEWARE
// ============================================================================


// ============================================================================
// HTTP ROUTES
// ============================================================================

app.post('/create-room', (req, res) => {
    const userId = req.userId;
    const userName = req.name;

    if (!userId) {
        logger.logError('ROOM_CREATION', 'Unauthorized room creation attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const owner: User = {
        id: userId,
        name: userName || 'Unknown'
    };

    const roomId = roomManager.createRoom(owner);
    logger.logRoomCreation(roomId, userId, userName);

    res.json({ roomId, message: "Successfully created room" });
});

// Helper function to start game
// Helper function to start game
const startGame = (room: Room) => {
    const gameState = gameManager.createGame(room);

    logger.logGameStart({
        roomId: room.id,
        ownerId: room.owner.id,
        guestId: room.guest!.id
    });

    const message_owner = {
        type: "game_state",
        gameState: gameState,
        yourUserId: room.owner.id
    };

    const message_guest = {
        type: "game_state",
        gameState: gameState,
        yourUserId: room.guest!.id
    };

    // Add delay to ensure WebSocket is connected
    setTimeout(() => {
        const ownerSent = WebSocketManager.sendToUser(room.owner.id, message_owner);
        const guestSent = WebSocketManager.sendToUser(room.guest!.id, message_guest);
        console.log(`[GAME] Game state sent - Owner: ${ownerSent}, Guest: ${guestSent}`);
    }, 100);
};

app.get('/friend-room', (req, res) => {
    const { roomId } = req.query;
    const userId = req.userId;
    const userName = req.name;

    // Validation
    if (!roomId || typeof roomId !== 'string') {
        return res.status(400).json({ error: "Missing or invalid roomId" });
    }

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const room = roomManager.getRoom(roomId);

    if (!room) {
        return res.status(404).json({ error: 'Room does not exist' });
    }

    const responseData = {
        state: room.state,
        message: room.state === 'waiting' ? 'Waiting for guest' : 'Room is active',
        owner: room.owner,
        guest: room.guest || null // guest may not have joined yet
    };

    // Role info
    if (userId === room.owner.id) {
        return res.json({ role: 'owner', ...responseData });
    }

    if (room.guest?.id === userId) {
        return res.json({ role: 'guest', ...responseData });
    }

    if (room.state === 'active') {
        return res.status(409).json({ error: 'Room is already full' });
    }

    // Guest joining for the first time
    const guest: User = { id: userId, name: userName || 'Unknown' };
    const joined = roomManager.joinRoom(roomId, guest);

    if (!joined) {
        return res.status(400).json({ error: 'Could not join room' });
    }

    // Notify owner
    WebSocketManager.sendToUser(room.owner.id, {
        type: 'guest_joined',
        guestId: userId,
        guestName: userName
    });

    // Start the game
    startGame(room);

    return res.json({ role: 'guest', ...responseData, guest });
});

app.get("/user", (req, res) => {
    res.json({ id: req.userId, name: req.name });

})
// ============================================================================
// CLEANUP & STARTUP
// ============================================================================

// Periodic cleanup of stale rooms
setInterval(() => {
    roomManager.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

server.listen(expressPort, () => {
    console.log(`HTTP server listening on port ${expressPort}`);
    console.log(`WebSocket server listening on port ${expressPort}`);
    logger.logError('SERVER_STARTUP', `Server started on port ${expressPort}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing servers...');
    logger.logError('SERVER_SHUTDOWN', 'Server shutting down gracefully');
    wss.close();
    process.exit(0);
});