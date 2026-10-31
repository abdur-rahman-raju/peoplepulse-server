import { Router } from "express";
import { getDB } from "../db.js";
import { todayInDhaka } from "../utils/validate.js";

const router = Router();

router.get("/events", async (req, res) => {
  try {
    const query = { eventDate: { $gte: todayInDhaka() } };

    let cursor = getDB().collection("events").find(query).sort({ eventDate: 1 });

    if (req.query.limit) {
      cursor = cursor.limit(parseInt(req.query.limit, 10) || 6);
    }

    const events = await cursor.toArray();
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load events" });
  }
});

export default router;