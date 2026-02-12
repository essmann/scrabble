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
import { RoomManager, type Room } from './roomManager.js';
import { WebSocketManager, type AuthenticatedWebSocket } from './ws/websocketManager.js';
import { WSMessageHandler } from './ws/WSMessageHandler.js';
import { parseMessage, parseCookies } from './utils/index.js';
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const expressPort = 3000;

// ============================================================================
// TYPES
// ============================================================================

interface JwtPayloadCustom {
    userId: string;
    name: string;
}


interface User {
    id: string;
    name?: string;
}

//SERVER WS MESSAGES
interface GameMessage {
    type: "game_start",
    owner: string,
    guest: string,
}



//Utility

const decodeJwt = (token: string): JwtPayloadCustom => {
    let decoded = jwt.verify(token, SECRET) as JwtPayloadCustom;
    return decoded;
}


//Instances
export const roomManager = new RoomManager();
export let gameManager = new GameManager();

wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    console.log("Client connected");

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.userToken; // This is the JWT token

    if (!token) {
        console.log("Couldn't find the userToken on the cookie. Closing.");
        ws.close(1008, 'No token found');
        return;
    }

    try {
        // Decode the JWT to get the actual userId
        const decoded = decodeJwt(token);
        const userId = decoded.userId; // Extract userId from decoded token

        console.log(`User ${userId} (${decoded.name}) connected via WebSocket`);

        // Store the connection with the actual userId
        ws.userId = userId;
        WebSocketManager.addClient(userId, ws);
        // ws.roomId = 
        ws.on('message', (rawMessage) => {
            console.log(rawMessage);
            try {
                console.log("message: " + rawMessage);
                // Convert to string depending on type
                const msg = parseMessage(rawMessage);

                // Parse JSON safely


                console.log('Received typed message:', msg);


                WSMessageHandler.handle(ws, msg);
            } catch (err) {
                console.error('Failed to handle message', err);
            }
        });


        ws.on('close', () => {
            if (ws.userId) {
                WebSocketManager.removeClient(ws.userId);
                // DON'T remove rooms here - let them persist
                // Rooms will be cleaned up by the periodic cleanup interval
                console.log(`[WS] User ${ws.userId} disconnected, but room persists`);
            }
        });
    } catch (error) {
        console.error("JWT verification failed:", error);
        ws.close(1008, 'Invalid token');
        return;
    }
});


// ============================================================================
// MIDDLEWARE
// ============================================================================

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
// HTTP ROUTES
// ============================================================================

app.post('/create-room', (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const roomId = roomManager.createRoom(userId);

    res.json({
        roomId,
        message: "Successfully created room"
    });
});

app.get('/friend-room', (req, res) => {
    const { roomId } = req.query;
    const userId = req.userId;

    if (!roomId || typeof roomId !== 'string') {
        console.log("Missing or invalid roomId");
        return res.status(400).json({ error: "Missing or invalid roomId" });
    }

    if (!userId) {
        console.log("UnAuthorized, no userId");

        return res.status(401).json({ error: 'Unauthorized' });
    }

    const room = roomManager.getRoom(roomId);

    if (!room) {
        console.log("Room does not exist");

        return res.status(404).json({ error: 'Room does not exist' });
    }

    // Owner checking their own room
    if (userId === room.ownerId) {
        return res.json({
            role: 'owner',
            state: room.state,
            message: room.state === 'waiting' ? 'Waiting for guest' : 'Room is active'
        });
    }


    // Guest attempting to join
    if (room.state === 'active' && room.guestId !== userId) {
        console.log(req.name);
        console.log("[FULL ROOM] :" + req.name);
        console.log("[FULL ROOM] userID received:" + req.userId);
        console.log("[FULL ROOM] userID in Room:" + room.guestId);




        console.log("Full room.");

        return res.status(409).json({ error: 'Room is already full' });
    }
    if (room.guestId == userId) {
        console.log("Same user trying to REjoin");
        res.json({
            role: 'guest',
            state: 'active',
            message: 'Successfully rejoined room'
        });
        return;
    }
    const joined = roomManager.joinRoom(roomId, userId);

    if (!joined) {
        console.log("joinRoom() failed");

        return res.status(400).json({ error: 'Could not join room' });
    }

    // Notify owner that guest has joined
    WebSocketManager.sendToUser(room.ownerId, {
        type: 'guest_joined',
        guestId: userId
    });

    res.json({
        role: 'guest',
        state: 'active',
        message: 'Successfully joined room'
    });

    //Create the game.
    //Create the game.
    let newGameState = gameManager.createGame(room);

    let ownerState = newGameState.players[room.ownerId];
    let guestState = newGameState.players[room.guestId as string];

    let message_owner = { type: "game_start", playerState: ownerState }
    let message_guest = { type: "game_start", playerState: guestState }

    // Add delay to ensure WebSocket is connected
    setTimeout(() => {
        const ownerSent = WebSocketManager.sendToUser(room.ownerId, message_owner);
        const guestSent = WebSocketManager.sendToUser(room.guestId as string, message_guest);

        console.log(`[GAME] Messages sent - Owner: ${ownerSent}, Guest: ${guestSent}`);
    }, 100); // 100ms delay




});


// ============================================================================
// WEBSOCKET SERVER
// ============================================================================


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
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing servers...');
    wss.close();
    process.exit(0);
});