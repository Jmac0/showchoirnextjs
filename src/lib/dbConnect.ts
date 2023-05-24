/* eslint-disable no-console */
import * as mongoose from "mongoose";

const MONGODB_URI: string | undefined = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

declare global {
  var mongoose: any; // This must be a `var` and not a `let / const`
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
    };

    if (MONGODB_URI) {
      console.log(`Connected to ${process.env.NODE_ENV} DB`);
      cached.promise = mongoose
        .connect(MONGODB_URI, opts)
        .then((mongoose) => mongoose);
    }
  } else {
    console.log("Please provide connection string for DB ");
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
