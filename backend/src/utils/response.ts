import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 400, errors: any = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const sendPaginated = (res: Response, data: any, total: number, page: number, pageSize: number, message: string = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
};
