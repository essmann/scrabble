import React from "react";

type ExistingGameModalProps = {
    onRejoin: () => void;
    onAbort: () => void;
    roomId: string;
};

export default function AlreadyInRoomModal({ onRejoin, onAbort, roomId }: ExistingGameModalProps) {
    const rejoin = () => {
        window.location.href = "/friend-room?roomId=" + roomId;

    }


    return (
        <div style={overlayStyle} className="z-100">
            <div style={modalStyle}>
                <h2>Game Already Exists</h2>
                <p>This game is already in your collection.</p>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button onClick={onRejoin}>Rejoin</button>
                    <button onClick={onAbort}>Abort</button>
                </div>
            </div>
        </div>
    );
}

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    minWidth: "300px",
};
