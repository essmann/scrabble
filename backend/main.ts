import { WebSocketServer, WebSocket } from 'ws';
import { type Request, type Response, type NextFunction } from 'express';
import express from "express";
import { userMiddleware } from './middleware.js';
import cookieParser from 'cookie-parser';
import http from 'http';
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const expressPort = 3000;

// ============================================================================
// TYPES
// ============================================================================

interface JwtPayloadCustom {
    userId: string;
}

interface Room {
    id: string;
    ownerId: string;
    guestId?: string;
    state: "waiting" | "active";
    createdAt: number;
}

interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    roomId?: string;
}


// ============================================================================
// STATE MANAGEMENT
// ============================================================================



class RoomManager {
    private rooms = new Map<string, Room>();
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

const roomManager = new RoomManager();

// ============================================================================
// WEBSOCKET MANAGEMENT
// ============================================================================

class WebSocketManager {
    private clients = new Map<string, AuthenticatedWebSocket>();

    addClient(userId: string, ws: AuthenticatedWebSocket): void {
        // Disconnect existing connection for this user
        const existingWs = this.clients.get(userId);
        if (existingWs && existingWs.readyState === WebSocket.OPEN) {
            existingWs.close(1000, "New connection established");
        }

        this.clients.set(userId, ws);
        console.log(`[WS] User ${userId} connected`);
    }

    removeClient(userId: string): void {
        this.clients.delete(userId);
        console.log(`[WS] User ${userId} disconnected`);
    }

    getClient(userId: string): AuthenticatedWebSocket | undefined {
        return this.clients.get(userId);
    }

    sendToUser(userId: string, message: any): boolean {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void {
        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const userIds = [room.ownerId, room.guestId].filter(id => id && id !== excludeUserId);

        for (const userId of userIds) {
            this.sendToUser(userId as string, message);
        }
    }
}

const wsManager = new WebSocketManager();


wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    console.log("Client connected");

    console.log(req.headers.cookie);
    const cookies = parseCookies(req.headers.cookie);
    const userId = cookies.userToken; // or whatever your cookie name is

    // If you're using JWT in a cookie:
    // const token = cookies.token;
    // Then decode the JWT to get userId

    if (!userId) {
        console.log("Couldn't find the userToken on the cookie. Closing.");
        ws.close(1008, 'No user ID found');
        return;
    }

    console.log(`User ${userId} connected via WebSocket`);

    // Store the connection
    ws.userId = userId;
    wsManager.addClient(userId, ws);

    ws.on('message', (message) => {
        console.log(`Received from ${userId}:`, message.toString());
        // Handle messages here
    });

    ws.on('close', () => {
        if (ws.userId) {
            wsManager.removeClient(ws.userId);
            roomManager.removeUserRooms(ws.userId);
        }
    });
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