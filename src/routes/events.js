import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../db.js";
import { todayInDhaka } from "../utils/validate.js";
import { verifyToken } from "../middleware/auth.js";
import { validateEvent } from "../utils/validate.js";

const router = Router();


const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


function toObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
    ? new ObjectId(id)
    : null;
}


router.get("/events", async (req, res) => {
  try {
    const { type, search, limit } = req.query;
    const query = { eventDate: { $gte: todayInDhaka() } };

    if (type && type !== "all") {
      query.eventType = String(type);
    }

    if (search) {
      query.title = { $regex: escapeRegex(String(search)), $options: "i" };
    }

    let cursor = getDB().collection("events").find(query).sort({ eventDate: 1 });

    if (limit) {
      cursor = cursor.limit(parseInt(limit, 10) || 6);
    }

    const events = await cursor.toArray();
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load events" });
  }
});


router.get("/events/:id", async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await getDB().collection("events").findOne({ _id });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load the event" });
  }
});


// ইভেন্ট বানানো
router.post("/events", verifyToken, async (req, res) => {
  try {
    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const doc = {
      ...data,
      // ইমেইল সবসময় token থেকে, ফর্ম থেকে না। তাই অন্যের নামে ইভেন্ট বানানো যাবে না
      creatorEmail: req.user.email,
      creatorName: req.user.name,
      creatorImage: req.user.image,
      joinedCount: 0,
      createdAt: new Date(),
    };

    const result = await getDB().collection("events").insertOne(doc);
    res.status(201).json({ message: "Event created", insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create the event" });
  }
});


router.get("/my-events", verifyToken, async (req, res) => {
  try {
    const events = await getDB()
      .collection("events")
      .find({ creatorEmail: req.user.email })
      .sort({ eventDate: 1 })
      .toArray();

    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your events" });
  }
});

export default router;