const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const Event = require("./event-info");
const authMiddleware = require("../auth");
const { eventRules, validate } = require("./validate-event");

function getGroupsCollection() {
  const database = mongoose.connection.useDb("Users", { useCache: true });
  if (!database) {
    throw new Error("Database connection is not ready.");
  }

  return database.collection("Groups");
}

function getAccountsCollection() {
  const database = mongoose.connection.useDb("Users", { useCache: true });
  if (!database) {
    throw new Error("Database connection is not ready.");
  }

  return database.collection("Accounts");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function resolveCurrentAccount(userId) {
  const accountsCollection = getAccountsCollection();
  const numericUserId = Number(userId);
  const clauses = [{ UserID: userId }];

  if (Number.isFinite(numericUserId)) {
    clauses.push({ UserID: numericUserId });
  }

  return accountsCollection.findOne({ $or: clauses });
}

function buildMembershipClauses(userId, email) {
  const clauses = [{ "Members.userId": userId }];
  const numericUserId = Number(userId);

  if (Number.isFinite(numericUserId)) {
    clauses.push({ "Members.userId": numericUserId });
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    clauses.push({ "Members.email": normalizedEmail });
  }

  return clauses;
}

function buildGroupIdClauses(groupId) {
  const clauses = [{ GroupID: groupId }, { GroupID: String(groupId) }];
  const numericGroupId = Number(groupId);

  if (Number.isFinite(numericGroupId)) {
    clauses.push({ GroupID: numericGroupId });
  }

  return clauses;
}

async function getAccessibleGroups(userId) {
  const account = await resolveCurrentAccount(userId);
  const groupsCollection = getGroupsCollection();
  return groupsCollection
    .find(
      { $or: buildMembershipClauses(userId, account?.Email) },
      { projection: { GroupID: 1, Name: 1 } },
    )
    .toArray();
}

const EVENT_LIST_PROJECTION = {
  _id: 1,
  user: 1,
  title: 1,
  description: 1,
  date: 1,
  startTime: 1,
  endTime: 1,
  forLabel: 1,
  groupId: 1,
  groupName: 1,
  location: 1,
  eventType: 1,
  createdAt: 1,
  updatedAt: 1,
};

async function resolveAssignedGroup(groupId, userId) {
  const cleanGroupId = String(groupId || "").trim();
  if (!cleanGroupId) {
    return null;
  }

  const account = await resolveCurrentAccount(userId);
  const groupsCollection = getGroupsCollection();
  const group = await groupsCollection.findOne({
    $and: [
      { $or: buildGroupIdClauses(cleanGroupId) },
      { $or: buildMembershipClauses(userId, account?.Email) },
    ],
  });

  if (!group) {
    const error = new Error("You can only assign events to groups you belong to.");
    error.statusCode = 403;
    throw error;
  }

  return {
    groupId: String(group.GroupID),
    groupName: String(group.Name || "").trim(),
  };
}

function buildEventPayload(body, assignedGroup) {
  const groupId = assignedGroup?.groupId ?? null;
  const groupName = assignedGroup?.groupName ?? null;

  return {
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    date: String(body.date || "").trim(),
    startTime: String(body.startTime || "").trim(),
    endTime: String(body.endTime || "").trim(),
    forLabel: groupName || String(body.forLabel || "Me").trim() || "Me",
    groupId,
    groupName,
    location: String(body.location || "").trim(),
    eventType: String(body.eventType || "").trim(),
  };
}

async function findAccessibleEvent(eventId, userId) {
  const event = await Event.findById(eventId);
  if (!event) {
    return null;
  }

  const cleanUserId = String(userId);
  if (!event.groupId) {
    return String(event.user) === cleanUserId ? event : null;
  }

  const groups = await getAccessibleGroups(cleanUserId);
  const isMember = groups.some((group) => String(group.GroupID) === String(event.groupId));
  return isMember ? event : null;
}

router.post("/", authMiddleware, eventRules, validate, async (req, res) => {
  try {
    const cleanUserId = String(req.user.id);
    const assignedGroup = await resolveAssignedGroup(req.body.groupId, cleanUserId);
    const event = await Event.create({
      user: cleanUserId,
      ...buildEventPayload(req.body, assignedGroup),
    });

    return res.status(201).json({ message: "Event created.", event });
  } catch (err) {
    return res.status(Number(err.statusCode) || 500).json({ error: err.message || "Unable to create event." });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const cleanUserId = String(req.user.id);
    const groups = await getAccessibleGroups(cleanUserId);
    const sharedGroupIds = groups.map((group) => String(group.GroupID));
    const filter = {
      $or: [
        {
          user: cleanUserId,
          $or: [{ groupId: null }, { groupId: { $exists: false } }, { groupId: "" }],
        },
        ...(sharedGroupIds.length > 0 ? [{ groupId: { $in: sharedGroupIds } }] : []),
      ],
    };

    if (req.query.start || req.query.end) {
      filter.date = {};
      if (req.query.start) {
        filter.date.$gte = String(req.query.start);
      }
      if (req.query.end) {
        filter.date.$lte = String(req.query.end);
      }
    }

    if (req.query.eventType) {
      filter.eventType = String(req.query.eventType);
    }

    if (req.query.forLabel) {
      filter.forLabel = String(req.query.forLabel);
    }

    const events = await Event.find(filter)
      .select(EVENT_LIST_PROJECTION)
      .sort({ date: 1, startTime: 1, createdAt: 1 })
      .lean();
    return res.status(200).json({ events });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to load events." });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await findAccessibleEvent(req.params.id, req.user.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    return res.status(200).json({ event });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to load event." });
  }
});

router.put("/:id", authMiddleware, eventRules, validate, async (req, res) => {
  try {
    const existingEvent = await findAccessibleEvent(req.params.id, req.user.id);
    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found." });
    }

    const assignedGroup = await resolveAssignedGroup(req.body.groupId, String(req.user.id));
    Object.assign(existingEvent, buildEventPayload(req.body, assignedGroup));
    await existingEvent.save();

    return res.status(200).json({ message: "Event updated.", event: existingEvent });
  } catch (err) {
    return res.status(Number(err.statusCode) || 500).json({ error: err.message || "Unable to update event." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await findAccessibleEvent(req.params.id, req.user.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    await Event.deleteOne({ _id: event._id });
    return res.status(200).json({ message: "Event deleted." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unable to delete event." });
  }
});

module.exports = router;
