import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { type Config, adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
export const SECRET = 'Edm4FJIJCL46sUfDfIw6qymzC84M7eoZrsfj2m5TQYQ=';

const customConfig: Config = {
    dictionaries: [adjectives, colors],
    separator: '-',
    length: 2,
};

const randomName: string = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals]
}); // big_red_donkey

export interface JwtPayloadCustom {
    userId: string;
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            userId?: string; // add userId to Express Request type
            name: string;
        }
    }
}


export function userMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.userToken;
    if (token) {
        try {
            const payload = jwt.verify(token, SECRET) as JwtPayloadCustom;
            req.userId = payload.userId;
            req.name = payload.name;
            // console.log("[Auth] user with ID: " + payload.userId + "and name: " + payload.name + " has existing token.");

            return next();
        } catch {
            // invalid token → create new
        }
    }

    // No token or invalid → create new user
    const newUserId = crypto.randomUUID();
    const newToken = jwt.sign({ userId: newUserId, name: uniqueNamesGenerator(customConfig) }, SECRET, { expiresIn: '7d' });
    res.cookie('userToken', newToken, { httpOnly: true });
    req.userId = newUserId;

    // console.log("[Auth] generated token for new user");
    next();
}
