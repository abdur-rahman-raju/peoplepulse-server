import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./src/db.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ name: "PeoplePulse API", status: "running" });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`PeoplePulse API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });