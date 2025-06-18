import { Response } from 'express';
import { HTTP_CODES } from './httpStatuscode';

export const sendSuccessResponse = (
  res: Response,
  message: string,
  data: any = null,
  statusCode: number = HTTP_CODES.OK
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = HTTP_CODES.INTERNAL_SERVER_ERROR
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};