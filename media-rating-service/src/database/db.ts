import mongoose from "mongoose";

async function connectToDatabase(): Promise<void> {
  try {
    // Ensure that DB_CONNECTION is a string, as process.env returns a string or undefined
    const dbConnection = process.env.DB_CONNECTION;

    if (!dbConnection) {
      throw new Error("DB_CONNECTION environment variable is not set.");
    }

    // Connecting to MongoDB
    await mongoose.connect(dbConnection);
    console.log("Connected successfully to MongoDB using Mongoose");
  } catch (error: unknown) {
    // Type narrowing to make sure 'error' is an instance of Error
    if (error instanceof Error) {
      console.error("Error connecting to MongoDB:", error.message);
    } else {
      console.error("Unknown error occurred during DB connection");
    }

    // Exit process if connection fails
    process.exit(1);
  }
}

export { connectToDatabase };
