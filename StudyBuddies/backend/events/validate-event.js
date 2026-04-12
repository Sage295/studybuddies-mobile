const { body, validationResult } = require("express-validator");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const eventRules = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("date").matches(DATE_PATTERN).withMessage("Date must be in YYYY-MM-DD format."),
  body("startTime").matches(TIME_PATTERN).withMessage("Start time must be in HH:mm format."),
  body("endTime")
    .optional({ values: "falsy" })
    .matches(TIME_PATTERN)
    .withMessage("End time must be in HH:mm format."),
  body("eventType")
    .isIn(["group", "study", "exam", "deadline"])
    .withMessage("Invalid event type."),
  body("forLabel").optional({ values: "falsy" }).trim(),
  body("groupId").optional({ values: "falsy" }).trim(),
  body("groupName").optional({ values: "falsy" }).trim(),
  body("location").optional({ values: "falsy" }).trim(),
  body("description").optional({ values: "falsy" }).trim(),
  body().custom((value) => {
    const startTime = String(value.startTime || "");
    const endTime = String(value.endTime || "");

    if (endTime && startTime && endTime <= startTime) {
      throw new Error("End time must be after start time.");
    }

    return true;
  }),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array().map((item) => item.msg).join(" "),
      errors: errors.array(),
    });
  }

  return next();
}

module.exports = { eventRules, validate };
