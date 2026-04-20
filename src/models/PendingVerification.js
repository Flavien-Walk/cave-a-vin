const mongoose = require('mongoose');

const PendingVerificationSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  code:      { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 }, // TTL: MongoDB supprime auto à expiration
});

module.exports = mongoose.model('PendingVerification', PendingVerificationSchema);
