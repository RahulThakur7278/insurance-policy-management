'use strict';

const mongoose = require('mongoose');

const carrierSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Carrier', carrierSchema);
