import { Request, Response, NextFunction } from "express";

const stripOperators = (obj: Record<string, unknown>): void => {
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      stripOperators(obj[key] as Record<string, unknown>);
    }
  }
};

export const sanitiseQuery = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.query) stripOperators(req.query as Record<string, unknown>);
  if (req.body && typeof req.body === "object")
    stripOperators(req.body as Record<string, unknown>);
  next();
};
