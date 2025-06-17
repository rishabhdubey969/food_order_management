import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from  '../src/database/db'
import ratingRoutes from './routes/ratingRoutes';
import './grpc/clients/grpc.server';
// import { errorHandler } from './utils/error.handler';

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = Number(process.env.REST_API_PORT);

// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies (for form data, though multer handles multipart)
app.use(express.urlencoded({ extended: true }));

// API Versioning: Mount routes under /api/v1
// app.use('/api', mediaRoutesV1);
app.use('/api', ratingRoutes);
app.get('/', (req: Request, res: Response) => {
  res.send('Media HTTP is working');
});

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

// Start the server after connecting to the database
connectToDatabase()
  .then(() => {
    console.log('Database connection is established');
    app.listen(port, () => {
      console.log(`Example app listening on port`, port);
    });
  })
  .catch(console.error);
