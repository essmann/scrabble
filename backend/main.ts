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
import { type Room } from './roomManager.js';
import { WebSocketManager, type AuthenticatedWebSocket } from './websocketManager.js';
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

// export interface Room {
//     id: string;
//     ownerId: string;
//     guestId?: string;
//     state: "waiting" | "active";
//     createdAt: number;
// }

// interface AuthenticatedWebSocket extends WebSocket {
//     userId?: string;
//     roomId?: string;
// }

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

// ============================================================================
// STATE MANAGEMENT
// ============================================================================



export class RoomManager {
    private rooms = new Map<string, Room>(); //RoomId, Room
    private userToRoom = new Map<string, string>(); // userId -> roomId


    createRoom(ownerId: string): string {
        // Clean up any existing room for this user
        this.removeUserRooms(ownerId);

        const roomId = crypto.randomUUID();
        const room: Room = {
            id: roomId,
            ownerId,
            state: "waiting",
            createdAt: Date.now()
        };

        this.rooms.set(roomId, room);
        this.userToRoom.set(ownerId, roomId);

        console.log(`[ROOM] Created room ${roomId} for user ${ownerId}`);
        return roomId;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    joinRoom(roomId: string, guestId: string): boolean {
        const room = this.rooms.get(roomId);

        if (!room) {
            console.log(`[ROOM] Room ${roomId} does not exist`);
            return false;
        }

        if (room.state !== "waiting") {
            console.log(`[ROOM] Room ${roomId} is not in waiting state`);
            return false;
        }

        if (room.ownerId === guestId) {
            console.log(`[ROOM] User ${guestId} is the owner, cannot join as guest`);
            return false;
        }

        room.guestId = guestId;
        room.state = "active";
        this.userToRoom.set(guestId, roomId);

        console.log(`[ROOM] User ${guestId} joined room ${roomId}`);
        return true;
    }

    removeUserRooms(userId: string): void {
        const roomId = this.userToRoom.get(userId);
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                // Clean up all participants
                this.userToRoom.delete(room.ownerId);
                if (room.guestId) {
                    this.userToRoom.delete(room.guestId);
                }
                this.rooms.delete(roomId);
                console.log(`[ROOM] Removed room ${roomId}`);
            }
        }
    }

    cleanup(): void {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        for (const [roomId, room] of this.rooms) {
            if (room.state === "waiting" && now - room.createdAt > maxAge) {
                this.removeUserRooms(room.ownerId);
            }
        }
    }
}

//Utility

const decodeJwt = (token: string): JwtPayloadCustom => {
    let decoded = jwt.verify(token, SECRET) as JwtPayloadCustom;
    return decoded;
}

// ============================================================================
// WEBSOCKET MANAGEMENT
// ============================================================================



//Instances
export const roomManager = new RoomManager();
export const wsManager = new WebSocketManager();
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
        wsManager.addClient(userId, ws);
        // ws.roomId = 
        ws.on('message', (rawMessage) => {
            console.log(rawMessage);
            try {
                let messageString: string;
                console.log("message: " + rawMessage);
                // Convert to string depending on type
                if (typeof rawMessage === 'string') {
                    messageString = rawMessage;
                } else if (rawMessage instanceof Buffer) {
                    messageString = rawMessage.toString('utf-8');
                } else if (rawMessage instanceof ArrayBuffer) {
                    messageString = Buffer.from(rawMessage).toString('utf-8');
                } else if (Array.isArray(rawMessage)) { // Buffer[]
                    messageString = Buffer.concat(rawMessage).toString('utf-8');
                } else {
                    throw new Error('Unsupported message type');
                }

                // Parse JSON safely
                const msg = JSON.parse(messageString) as SocketMessage;

                console.log('Received typed message:', msg);


                // Example switch
                switch (msg.type) {
                    case 'request_game_update':
                        let room: Room | undefined = roomManager.getRoom(msg.roomId as string);
                        if (!room) {
                            console.log("[WS] Room doesn't exist");

                        }
                        if (msg.roomId && room?.state === 'active' && room?.ownerId == ws.userId || room?.guestId == ws.userId) {
                            let gameState = gameManager.getGame(msg.roomId as string);
                            let playerState = gameState?.players[ws.userId as string];
                            if (gameState) {
                                ws.send(JSON.stringify({ type: 'game_update', playerState }));
                            }
                        }
                        else if (!msg.roomId) {
                            console.log("[WS] Room ID doesn't exist");
                        }

                        break;
                    case 'ping':
                        ws.send(JSON.stringify({ type: 'pong' }));
                        break;
                    default:
                        console.warn('Unknown message type', msg.type);
                }
            } catch (err) {
                console.error('Failed to handle message', err);
            }
        });


        ws.on('close', () => {
            if (ws.userId) {
                wsManager.removeClient(ws.userId);
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
function parseCookies(cookieHeader?: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
        });
    }
    return cookies;
}
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
    wsManager.sendToUser(room.ownerId, {
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
        const ownerSent = wsManager.sendToUser(room.ownerId, message_owner);
        const guestSent = wsManager.sendToUser(room.guestId as string, message_guest);

        console.log(`[GAME] Messages sent - Owner: ${ownerSent}, Guest: ${guestSent}`);
    }, 100); // 100ms delay




});

app.get('/user', (req, res) => {
    res.json({ userId: req.userId });
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