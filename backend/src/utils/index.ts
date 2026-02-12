import type { SocketMessage } from "../types/SocketMessage.js";

export function parseMessage(rawMessage: any): SocketMessage {
    let messageString: string;
    console.log("message: " + rawMessage);
    // Convert to string depending on type
    if (typeof rawMessage === 'string') {
        messageString = rawMessage;
    } else if (rawMessage instanceof Buffer) {
        messageString = rawMessage.toString('utf-8');
    } else if (rawMessage instanceof ArrayBuffer) {
        messageString = Buffer.from(rawMessage).toString('utf-8');
    } else if (Array.isArray(rawMessage)) { // Buffer[]
        messageString = Buffer.concat(rawMessage).toString('utf-8');
    } else {
        throw new Error('Unsupported message type');
    }

    // Parse JSON safely
    const msg = JSON.parse(messageString) as SocketMessage;
    return msg;
}
export function parseCookies(cookieHeader?: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
        });
    }
    return cookies;
}