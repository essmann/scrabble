import type { GameState } from "./game";
export interface BaseWebsocketMessage {
    type: string;

}



export interface GameUpdateMessage extends BaseWebsocketMessage {
    type: "game_update",
    filteredGameState: GameState,

}

export type WebsocketMessage = GameUpdateMessage | BaseWebsocketMessage;