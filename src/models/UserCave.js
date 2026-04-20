const mongoose = require('mongoose');

const UserCaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  emplacements: {
    type: [String],
    default: [],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

UserCaveSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('UserCave', UserCaveSchema);
