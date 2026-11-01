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


router.post("/events", verifyToken, async (req, res) => {
  try {
    const { errors, data } = validateEvent(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const doc = {
      ...data,
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

// ইভেন্টে join করা (একজন একবারই)
router.post("/events/:id/join", verifyToken, async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid event id" });

    const db = getDB();
    const event = await db.collection("events").findOne({ _id });
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.eventDate < todayInDhaka()) {
      return res.status(400).json({ message: "This event has already taken place" });
    }
    if (event.creatorEmail === req.user.email) {
      return res.status(400).json({ message: "You organised this event, so you are already part of it" });
    }

    try {
      await db.collection("joins").insertOne({
        eventId: _id,
        eventTitle: event.title,
        userEmail: req.user.email,
        userName: req.user.name,
        userImage: req.user.image,
        joinedAt: new Date(),
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You have already joined this event" });
      }
      throw err;
    }

    const updated = await db
      .collection("events")
      .updateOne({ _id, joinedCount: { $lt: event.volunteersNeeded } }, { $inc: { joinedCount: 1 } });

    if (updated.modifiedCount === 0) {
      await db.collection("joins").deleteOne({ eventId: _id, userEmail: req.user.email });
      return res.status(409).json({ message: "Sorry, all volunteer spots are taken" });
    }

    res.status(201).json({ message: "You joined the event" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not join the event" });
  }
});

router.delete("/events/:id/join", verifyToken, async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid event id" });

    const db = getDB();
    const result = await db.collection("joins").deleteOne({ eventId: _id, userEmail: req.user.email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "You have not joined this event" });
    }

    await db.collection("events").updateOne({ _id, joinedCount: { $gt: 0 } }, { $inc: { joinedCount: -1 } });
    res.json({ message: "You left the event" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not leave the event" });
  }
});


router.get("/events/:id/joined", verifyToken, async (req, res) => {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(400).json({ message: "Invalid event id" });

    const found = await getDB().collection("joins").findOne({ eventId: _id, userEmail: req.user.email });
    res.json({ joined: Boolean(found) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not check your join status" });
  }
});

router.get("/joined-events", verifyToken, async (req, res) => {
  try {
    const rows = await getDB()
      .collection("joins")
      .aggregate([
        { $match: { userEmail: req.user.email } },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: "$event" },
        { $sort: { "event.eventDate": 1 } },
      ])
      .toArray();

    res.json({ events: rows.map((r) => ({ ...r.event, joinedAt: r.joinedAt })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load joined events" });
  }
});

export default router;