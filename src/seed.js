import "dotenv/config";
import { connectDB } from "./db.js";

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
};

const samples = [
  ["Winter Clothes Distribution", "Clothes Distribution", "Mirpur 10, Dhaka", 6, 40,
    "We collect and hand out warm jackets, sweaters and socks to families sleeping outdoors near Mirpur 10."],
  ["Blankets for the Needy", "Clothes Distribution", "Mohammadpur, Dhaka", 9, 30,
    "Night-time blanket distribution along the footpaths of Mohammadpur, in small groups with a team lead."],
  ["Riverbank Cleanup Drive", "Cleanup", "Buriganga Riverside, Dhaka", 12, 60,
    "Gloves and bags are provided. We clear plastic and waste from a stretch of the riverbank."],
  ["Tree Plantation Morning", "Plantation", "Hatirjheel, Dhaka", 15, 50,
    "Plant 200 saplings with local schools and learn how to take care of them afterwards."],
  ["Free Health Camp", "Health Camp", "Savar, Dhaka", 18, 25,
    "Basic check-ups, blood pressure and sugar tests for villagers, run together with local doctors."],
  ["Community Food Kitchen", "Food Distribution", "Old Dhaka", 21, 35,
    "Cook and serve hot khichuri to 300 people. Cooking starts at sunrise, serving at noon."],
];

async function run() {
  const db = await connectDB();
  const events = db.collection("events");

  await events.deleteMany({ creatorEmail: "demo@peoplepulse.app" });

  const docs = samples.map(([title, eventType, location, days, volunteersNeeded, description], i) => ({
    title,
    description,
    eventType,
    location,
    eventDate: addDays(days),
    volunteersNeeded,
    thumbnail: `https://picsum.photos/seed/peoplepulse-${i + 1}/800/500`,
    creatorEmail: "demo@peoplepulse.app",
    creatorName: "PeoplePulse Team",
    joinedCount: 0,
    createdAt: new Date(),
  }));

  const result = await events.insertMany(docs);
  console.log(`Inserted ${result.insertedCount} sample events`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});