import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export const SECRET = process.env.JWT_SECRET || 'Edm4FJIJCL46sUfDfIw6qymzC84M7eoZrsfj2m5TQYQ';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            name?: string;
        }
    }
}

interface JwtPayloadCustom {
    userId: string;
    name: string;
}

/**
 * Generate a random user ID
 */
function generateUserId(): string {
    return randomUUID();
}

/**
 * Generate a random username (adjective-color format)
 */
function generateUserName(): string {
    const adjectives = [
        'happy', 'clever', 'bright', 'swift', 'brave', 'calm', 'eager',
        'fancy', 'gentle', 'jolly', 'kind', 'lively', 'merry', 'nice',
        'proud', 'quick', 'witty', 'zany', 'cool', 'smart'
    ];

    const colors = [
        'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink',
        'cyan', 'magenta', 'lime', 'indigo', 'violet', 'coral', 'crimson',
        'navy', 'teal', 'gold', 'silver', 'bronze', 'azure'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return `${adjective}-${color}`;
}

/**
 * User middleware - handles JWT authentication and user session
 * 
 * CRITICAL: This middleware must run BEFORE any routes that need user authentication
 * It ensures every request has a valid user session with a JWT token stored in cookies
 */
export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.userToken;

    // Debug logging
    console.log(`[MIDDLEWARE] Request to ${req.method} ${req.path}`);
    console.log(`[MIDDLEWARE] Cookie present: ${!!token}`);

    // If no token exists, create a new user session
    if (!token) {
        console.log('[MIDDLEWARE] No token found, creating new user session');

        const userId = generateUserId();
        const userName = generateUserName();

        // Create JWT token
        token = jwt.sign(
            { userId, name: userName },
            SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie with optimal settings for localhost development
        res.cookie('userToken', token, {
            httpOnly: true,           // Prevents JavaScript access (XSS protection)
            sameSite: 'lax',          // 'lax' is better for navigation than 'strict'
            secure: false,            // Set to true in production with HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'                 // Available on all paths
        });

        console.log(`[MIDDLEWARE] Created new user: ${userId} (${userName})`);
        console.log(`[MIDDLEWARE] Token will be available in response cookies`);
    } else {
        console.log('[MIDDLEWARE] Using existing token from cookies');
    }

    // Verify and decode token
    try {
        const decoded = jwt.verify(token, SECRET) as JwtPayloadCustom;
        req.userId = decoded.userId;
        req.name = decoded.name;

        console.log(`[MIDDLEWARE] Authenticated user: ${decoded.userId} (${decoded.name})`);
    } catch (error) {
        console.error('[MIDDLEWARE] Token verification failed:', error);

        // Clear invalid token
        res.clearCookie('userToken');

        return res.status(401).json({
            error: 'Invalid or expired token',
            message: 'Please refresh the page to get a new session'
        });
    }

    next();
};

/**
 * Optional: Session verification endpoint
 * Use this to ensure a session exists before making other requests
 */
export const createSessionVerificationRoute = (app: any) => {
    app.get('/api/verify-session', (req: Request, res: Response) => {
        const userId = req.userId;
        const userName = req.name;

        if (!userId) {
            return res.status(401).json({
                error: 'No session found',
                hasSession: false
            });
        }

        res.json({
            hasSession: true,
            userId,
            userName,
            message: 'Session verified successfully'
        });
    });

    console.log('[MIDDLEWARE] Session verification endpoint registered at /api/verify-session');
};

/**
 * Optional: Clear session endpoint
 * Allows users to manually clear their session
 */
export const createClearSessionRoute = (app: any) => {
    app.post('/api/clear-session', (req: Request, res: Response) => {
        res.clearCookie('userToken');
        res.json({
            message: 'Session cleared successfully',
            cleared: true
        });
    });

    console.log('[MIDDLEWARE] Clear session endpoint registered at /api/clear-session');
};