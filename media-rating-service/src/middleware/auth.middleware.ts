import { Request, Response, NextFunction } from 'express';
import { authClient } from '../grpc/clients/user';

/**
 * Middleware to authenticate requests using a token.
 * It checks for the presence of an authorization header,
 * validates the token via gRPC, and attaches the user ID to the request object.
 *
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Authorization header missing' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Token missing' });
      return;
    }

    // Function to validate the token using gRPC
    const validateToken = (): Promise<{ isValid: boolean; userId: string }> => {
      return new Promise((resolve, reject) => {
        authClient.ValidateToken(
          { accessToken: token },
          (
            err: any,
            response: { isValid: boolean; userId: string } | PromiseLike<{ isValid: boolean; userId: string }>
          ) => {
            if (err) return reject(err);
            console.log('Token validation response:', response);
            resolve(response);
          }
        );
      });
    };

    const response = await validateToken();

    if (!response.isValid) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    (req as any).userId = response.userId;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Token validation error', error });
  }
}
