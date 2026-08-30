'use strict';

const mongoose = require('mongoose');

const USER_TYPES = ['admin', 'standard', 'premium', 'guest'];
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number format'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      index: true,
    },
    gender: {
      type: String,
      enum: { values: GENDERS, message: `Gender must be one of: ${GENDERS.join(', ')}` },
      default: 'prefer_not_to_say',
    },
    userType: {
      type: String,
      enum: { values: USER_TYPES, message: `userType must be one of: ${USER_TYPES.join(', ')}` },
      default: 'standard',
    },
  },
  { timestamps: true, versionKey: false },
);

// Text index for username search
userSchema.index({ firstName: 'text' });

module.exports = mongoose.model('User', userSchema);
