// import { useMemo } from "react";
// import type { GameState } from "../types/game";
// interface OpponentInfo {
//     username: string;
//     userId: string;
//     isConnected: boolean;
// }
// // ✅ Pass user as parameter
// export function useOpponent(
//     gameState: GameState | null,
//     currentUserId: string
// ): OpponentInfo | null {
//     return useMemo(() => {
//         if (!gameState) return null;

//         const opponentId = gameState.room.owner.id === currentUserId
//             ? gameState.room.guest?.id
//             : gameState.room.owner.id;

//         if (!opponentId) return null;

//         const opponentPlayer = gameState.players[opponentId];

//         if (!opponentPlayer) {
//             // Opponent hasn't joined yet, use room info
//             const opponentInfo = gameState.room.owner.id === currentUserId
//                 ? gameState.room.guest
//                 : gameState.room.owner;

//             return opponentInfo ? {
//                 userId: opponentInfo.id,
//                 name: opponentInfo.name,
//                 score: 0
//             } : null;
//         }

//         return {
//             userId: opponentPlayer.userId,
//             name: opponentPlayer.name,
//             score: opponentPlayer.score,
//         };
//     }, [gameState, currentUserId]);
// }