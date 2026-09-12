import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../config/index.js";

const { accessTokenSecret, accessTokenExpiry } = config;

// Destructure error classes from default import (CJS compat fix)
const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt;

// Extend JwtPayload for strong typing on decoded tokens
interface TokenPayload extends JwtPayload {
    userId: string;
}

const createAccessToken = (userId: string): string => {
    try {
        const options: SignOptions = {
            expiresIn: accessTokenExpiry as NonNullable<SignOptions["expiresIn"]>,
        };

        return jwt.sign({ userId }, accessTokenSecret, options);
    } catch (err) {
        throw new Error(`Error creating access token: ${(err as Error).message}`);
    }
};

const verifyAccessToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, accessTokenSecret) as TokenPayload;
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            console.error("Access token expired");
        } else if (err instanceof NotBeforeError) {
            console.error("Access token not yet valid");
        } else if (err instanceof JsonWebTokenError) {
            console.error(`Invalid access token: ${(err as InstanceType<typeof JsonWebTokenError>).message}`);
        } else {
            console.error(`Unexpected JWT error: ${(err as Error).message}`);
        }
        return null;
    }
};

// Useful for refresh-token flows — check expiry without treating it as an error
const isTokenExpired = (token: string): boolean => {
    try {
        jwt.verify(token, accessTokenSecret);
        return false;
    } catch (err) {
        return err instanceof TokenExpiredError;
    }
};

const decodeToken = (token: string): TokenPayload | null => {
    const decoded = jwt.decode(token);
    return decoded && typeof decoded === "object" ? (decoded as TokenPayload) : null;
};

const jwtService = {
    createAccessToken,
    verifyAccessToken,
    isTokenExpired,
    decodeToken,
} as const;

export default jwtService;