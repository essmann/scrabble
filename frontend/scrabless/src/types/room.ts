export interface Room {
    id: string;
    ownerId: string;
    guestId?: string;
    state: "waiting" | "active";
    createdAt: number;
}