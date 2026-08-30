'use strict';

const mongoose = require('mongoose');

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const scheduledMessageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: { values: DAYS, message: `Day must be one of: ${DAYS.join(', ')}` },
      lowercase: true,
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM (24-hour) format'],
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

// Compound index for efficient cron lookup
scheduledMessageSchema.index({ day: 1, time: 1, isDelivered: 1 });

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
