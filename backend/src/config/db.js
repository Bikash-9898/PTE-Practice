import mongoose from "mongoose";

/**
 * Connect to MongoDB and exit the process on failure.
 * The server boot script awaits this function before listening on a port.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error("❌  MONGO_URI is missing from .env");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Reasonable timeouts so a dead Mongo doesn't hang the boot.
      serverSelectionTimeoutMS: 10000,
    });
    // eslint-disable-next-line no-console
    console.log(`✅  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  }
}
