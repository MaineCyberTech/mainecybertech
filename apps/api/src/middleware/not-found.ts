import { type Request, type Response } from "express";
import { failure } from "../types";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json(failure("NOT_FOUND", "Resource not found", 404));
}
