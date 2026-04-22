// src/utils/sendResponse.ts
import type { Response } from "express";

type TMeta = {
  timestamp?: string;
  [key: string]: unknown;
};

type TError = {
  code?: string;
  details?: unknown;
};

type TResponse<T> = {
  res: Response;
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: TMeta;
  error?: TError;
};

export const sendResponse = <T>({
  res,
  statusCode,
  success,
  message,
  data,
  meta,
  error,
}: TResponse<T>) => {
  res.status(statusCode).json({
    success,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error,
  });
};