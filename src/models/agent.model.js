'use strict';

const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    agentName: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Agent', agentSchema);
