export const EVENT_TYPES = [
  "Clothes Distribution",
  "Food Distribution",
  "Cleanup",
  "Plantation",
  "Blood Donation",
  "Health Camp",
  "Education",
  "Other",
];

export function todayInDhaka() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateEvent(body = {}) {
  const errors = {};

  const data = {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim(),
    eventType: String(body.eventType ?? "").trim(),
    thumbnail: String(body.thumbnail ?? "").trim(),
    location: String(body.location ?? "").trim(),
    eventDate: String(body.eventDate ?? "").trim(),
    volunteersNeeded: Number(body.volunteersNeeded),
  };

  if (data.title.length < 5 || data.title.length > 100) {
    errors.title = "Title must be between 5 and 100 characters";
  }

  if (data.description.length < 20 || data.description.length > 1500) {
    errors.description = "Description must be between 20 and 1500 characters";
  }

  if (!EVENT_TYPES.includes(data.eventType)) {
    errors.eventType = "Please choose a valid event type";
  }

  if (!isHttpUrl(data.thumbnail)) {
    errors.thumbnail = "Thumbnail must be a valid image URL";
  }

  if (data.location.length < 3 || data.location.length > 120) {
    errors.location = "Location must be between 3 and 120 characters";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) {
    errors.eventDate = "Please choose a valid date";
  } else if (data.eventDate <= todayInDhaka()) {
    errors.eventDate = "Event date must be in the future";
  }

  if (
    !Number.isInteger(data.volunteersNeeded) ||
    data.volunteersNeeded < 1 ||
    data.volunteersNeeded > 5000
  ) {
    errors.volunteersNeeded = "Volunteers needed must be a whole number from 1 to 5000";
  }

  return { errors, data };
}