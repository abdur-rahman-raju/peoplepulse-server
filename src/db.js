import { MongoClient } from "mongodb";

let db;

export async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME || "peoplepulse");
  await db.collection("joins").createIndex({ eventId: 1, userEmail: 1 }, { unique: true });
  await db.collection("joins").createIndex({ userEmail: 1 });
  console.log("MongoDB connected");
  return db;
}

export function getDB() {
  if (!db) throw new Error("Database is not connected yet");
  return db;
}