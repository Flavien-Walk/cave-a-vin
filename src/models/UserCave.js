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

// Unique par utilisateur + nom + lieu (permet "Cave 1" dans Lyon ET dans Pau)
UserCaveSchema.index({ userId: 1, name: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('UserCave', UserCaveSchema);
