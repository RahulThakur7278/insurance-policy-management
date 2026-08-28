'use strict';

const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Account', accountSchema);
