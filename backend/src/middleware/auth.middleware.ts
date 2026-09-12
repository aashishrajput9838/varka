import { Request, Response, NextFunction } from "express";
import jwtService from "../services/jwt.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined = undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please sign in.",
      });
    }

    const decoded = jwtService.verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid token. Please sign in again.",
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
