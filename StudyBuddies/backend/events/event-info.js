const mongoose = require("mongoose");

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const EventSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: TIME_PATTERN },
    endTime: {
      type: String,
      default: "",
      validate: {
        validator(value) {
          return !value || TIME_PATTERN.test(value);
        },
        message: "End time must be a valid 24-hour time.",
      },
    },
    forLabel: { type: String, default: "Me", trim: true },
    groupId: { type: String, default: null, index: true },
    groupName: { type: String, default: null, trim: true },
    location: { type: String, default: "", trim: true },
    eventType: {
      type: String,
      enum: ["group", "study", "exam", "deadline"],
      required: true,
    },
  },
  { timestamps: true, collection: "CEvents" },
);

module.exports = mongoose.model("Event", EventSchema);
