// GameContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Letter } from "../types/game";
import type { StagedTile } from "../components/Game/Game";
import type { ClickedTileDirection, TilePosition } from "../components/Game/types";

// Define context type
type GameContextType = {
    hand: Letter[];
    setHand: React.Dispatch<React.SetStateAction<Letter[]>>;
    stagedTiles: StagedTile[];
    setStagedTiles: React.Dispatch<React.SetStateAction<StagedTile[]>>;
    myTurn: boolean;
    clickedTile: TilePosition | null;
    setClickedTile: React.Dispatch<React.SetStateAction<TilePosition | null>>;
    clickedTileDirection: ClickedTileDirection | null;
    setClickedTileDirection: React.Dispatch<React.SetStateAction<ClickedTileDirection | null>>;
    removeFromHand: (letter: Letter) => void;
};

// Keyboard tile interface
interface TilePositionAndKeyboardFlag extends TilePosition {
    updateTileDirection: boolean;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider
export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [hand, setHand] = useState<Letter[]>(['A', 'B', 'C', 'Q', 'D', 'E', 'Z']);
    const [stagedTiles, setStagedTiles] = useState<StagedTile[]>([]);
    const [myTurn] = useState(true);
    const [clickedTile, setClickedTile] = useState<TilePosition | TilePositionAndKeyboardFlag | null>(null);
    const [clickedTileDirection, setClickedTileDirection] = useState<ClickedTileDirection | null>(null);

    const tileRef = useRef<TilePosition | TilePositionAndKeyboardFlag | null>(null);

    const removeFromHand = (letter: Letter) => {
        setHand(prev => {
            let found = false;
            return prev.filter(l => {
                if (!found && l === letter) {
                    found = true;
                    return false;
                }
                return true;
            });
        });
    };
    useEffect(() => {
        console.log("CLICKED TILE!");
        console.log(clickedTile);


        const prevTile = tileRef.current;

        tileRef.current = clickedTile;

        if (!prevTile) return;

        const sameTile =
            prevTile.row === clickedTile?.row &&
            prevTile.col === clickedTile?.col;


        if (clickedTile && "updateTileDirection" in clickedTile) {
            return;
        }
        if (!sameTile) {
            setClickedTileDirection("RIGHT");
            return;
        }
        if (clickedTile)
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

    }, [clickedTile]);

    return (
        <GameContext.Provider
            value={{
                hand,
                setHand,
                stagedTiles,
                setStagedTiles,
                myTurn,
                clickedTile,
                setClickedTile,
                clickedTileDirection,
                setClickedTileDirection,
                removeFromHand
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within a GameProvider");
    return context;
};
