export interface Room {
    id: string;
    owner: User;
    guest?: User;
    state: "waiting" | "active";
    createdAt: number;
}

export interface User {
    id: string;
    name: string;
}