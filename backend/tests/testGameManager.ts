import { GameManager, RoomManager, type Room } from "../src/main.js";

// Fake rooms for testing
const roomManager = new RoomManager();
const gameManager = new GameManager();

const ownerId = "user1";
const guestId = "user2";

// Create a room
const roomId = roomManager.createRoom(ownerId);
const room: Room = {
    id: roomId,
    ownerId,
    guestId,
    state: "active",
    createdAt: Date.now()
};

// Add guest to room in RoomManager
roomManager.joinRoom(roomId, guestId);

// Create a game
gameManager.createGame(room);

// Access game state
const gameState = (gameManager as any).games.get(roomId); // cast to any to peek inside
console.log(JSON.stringify(gameState, null, 2));

// while(true){}