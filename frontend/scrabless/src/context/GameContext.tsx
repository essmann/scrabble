// GameContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Letter } from "../types/game";
import type { StagedTile } from "../components/Game/Game";
import type { ClickedTileDirection, TilePosition } from "../components/Game/types";

//  Define the context type
type GameContextType = {
    hand: Letter[];
    setHand: React.Dispatch<React.SetStateAction<Letter[]>>;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
    myTurn: boolean;
    clickedTile: TilePosition | null;
    setClickedTile: React.Dispatch<React.SetStateAction<TilePosition>>;
    clickedTileDirection: ClickedTileDirection | null;
    setClickedTileDirection: React.Dispatch<React.SetStateAction<ClickedTileDirection | null>>;
};

//  Create context with proper type
const GameContext = createContext<GameContextType | undefined>(undefined);

//  Provider
export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [myTurn] = useState(true);
    const [clickedTile, setClickedTile] = useState<TilePosition>({} as TilePosition);
    const [clickedTileDirection, setClickedTileDirection] = useState<ClickedTileDirection | null>(null);
    const tileRef = useRef<TilePosition | null>(null);
    useEffect(() => {

        //Check if a new tile has been clicked
        const prevTile = tileRef.current;

        // Always update ref first for next render
        tileRef.current = clickedTile;

        if (!prevTile) return;

        const sameTile =
            prevTile.row === clickedTile.row &&
            prevTile.col === clickedTile.col;

        if (!sameTile) {
            setClickedTileDirection("RIGHT");
            return;
        }

        switch (clickedTileDirection) {

            case "RIGHT":
                setClickedTileDirection("DOWN");
                break;
            case "DOWN":
                setClickedTileDirection(null);
                break;
            default:
                setClickedTileDirection("RIGHT");
        }
        console.log(`New Clicked Tile Direction: ${clickedTileDirection}`);

    }, [clickedTile])

    return (
        <GameContext.Provider value={{ hand, setHand, stagedTiles, setStagedTiles, myTurn, clickedTile, setClickedTile, clickedTileDirection, setClickedTileDirection }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
};
