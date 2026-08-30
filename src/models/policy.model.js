'use strict';

const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: [true, 'Policy number is required'],
      trim: true,
      unique: true,
      index: true,
    },
    policyStartDate: {
      type: Date,
      required: [true, 'Policy start date is required'],
    },
    policyEndDate: {
      type: Date,
      required: [true, 'Policy end date is required'],
      validate: {
        validator(v) {
          return v > this.policyStartDate;
        },
        message: 'Policy end date must be after start date',
      },
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category (LOB) reference is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Carrier',
      required: [true, 'Carrier company reference is required'],
      index: true,
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

module.exports = mongoose.model('Policy', policySchema);
