export interface User {
    id: string;
    name: string;
}
import { useEffect, useState } from "react";
import { apiManager } from "../api/apiManager";
export function useUser(): User | null {
    const [user, setUser] = useState<User | null>({} as User);
    useEffect(() => {

        (async () => {
            let user = await apiManager.getUser()
            setUser(user);
        })()
    }, [])
    return user;
}

