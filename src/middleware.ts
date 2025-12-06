import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";

export const userMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers["token"];

    if (!header) {
        res.status(403).json({ message: "You are not logged in" });
        return;
    }

    try {
        const decoded = jwt.verify(header as string, JWT_SECRET) as any;
        // attach userId to request
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
        return;
    }
};