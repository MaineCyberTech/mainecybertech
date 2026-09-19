import { type Request, type Response, type NextFunction } from "express";

export function requestTimeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: {
            code: "REQUEST_TIMEOUT",
            message: `Request exceeded ${ms}ms timeout`,
          },
        });
      }
    }, ms);

    res.on("finish", () => clearTimeout(timer));
    next();
  };
}
