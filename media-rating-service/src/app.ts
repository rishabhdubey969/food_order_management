import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import mediaRoutesV1 from './routes/mediaRoutes';
import ratingRoutes from './routes/ratingRoutes';
// import { errorHandler } from './utils/error.handler';

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = Number(process.env.REST_API_PORT);

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies (for form data, though multer handles multipart)
app.use(express.urlencoded({ extended: true }));

// API Versioning: Mount routes under /api/v1
app.use('/api', mediaRoutesV1);
app.use('/api', ratingRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'Media service is running!' });
});

// Catch-all for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Global error handling middleware (MUST be the last middleware)
// app.use(errorHandler);

// Start the server
app.listen(port, () => {
    console.log(`Media service listening on port ${port}`);
    console.log(`Access API at http://localhost:${port}/api`);
});