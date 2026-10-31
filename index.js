import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ name: "PeoplePulse API", status: "running" });
});

app.listen(port, () => {
  console.log(`PeoplePulse API listening on port ${port}`);
});