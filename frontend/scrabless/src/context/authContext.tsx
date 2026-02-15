// AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import { apiManager } from "../api/apiManager";

// Define the user type
type User = {
    id: string;
    name: string;
} | null;

// Define the context shape
type AuthContextType = {
    user: User;
    login: (userData: User) => void;
    logout: () => void;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User>(null);

    const login = (userData: User) => setUser(userData);
    const logout = () => setUser(null);


    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


// Custom hook for easy usage
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
