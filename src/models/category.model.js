'use strict';

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Category', categorySchema);
