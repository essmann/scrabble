
//For dragging

import type { Letter } from "../../types/game";
//Generic Tile Data. This is for placeable tiles, tiles that are placed, etc.

interface PlayerTile {
    letter: Letter | null;
}


//This is from the Input Panel to the board.
//Comes from the input panel and can be placed on the board.
interface TemporaryTile extends PlayerTile {

    staged: true;

}

//Already existing tile 
interface TileToReposition {
    sourceTile: TilePosition;
    destinationTile: TilePosition;
}

export interface TilePosition {
    row: number;
    col: number;
}

//

export type ClickedTileDirection = "DOWN" | "RIGHT";

