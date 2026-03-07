export function parseMessage(rawMessage) {
    let messageString;
    console.log("message: " + rawMessage);
    // Convert to string depending on type
    if (typeof rawMessage === 'string') {
        messageString = rawMessage;
    }
    else if (rawMessage instanceof Buffer) {
        messageString = rawMessage.toString('utf-8');
    }
    else if (rawMessage instanceof ArrayBuffer) {
        messageString = Buffer.from(rawMessage).toString('utf-8');
    }
    else if (Array.isArray(rawMessage)) { // Buffer[]
        messageString = Buffer.concat(rawMessage).toString('utf-8');
    }
    else {
        throw new Error('Unsupported message type');
    }
    // Parse JSON safely
    const msg = JSON.parse(messageString);
    return msg;
}
export function parseCookies(cookieHeader) {
    const cookies = {};
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
//# sourceMappingURL=index.js.map