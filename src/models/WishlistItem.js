const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
  nom:         { type: String, required: true, trim: true, maxlength: 300 },
  producteur:  { type: String, trim: true, maxlength: 300 },
  region:      { type: String, trim: true, maxlength: 200 },
  appellation: { type: String, trim: true, maxlength: 200 },
  annee:       { type: Number, min: 1800, max: 2100 },
  couleur:     { type: String, enum: ['rouge', 'blanc', 'rosé', 'effervescent', 'moelleux', 'autre'] },
  priorite:    { type: String, enum: ['haute', 'normale', 'basse'], default: 'normale' },
  prixCible:   { type: Number, min: 0 },
  note:        { type: String, trim: true, maxlength: 1000 },
  url:         { type: String, trim: true },
  isPurchased: { type: Boolean, default: false },
  purchasedAt: { type: Date },
  userId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

WishlistItemSchema.index({ isPurchased: 1 });
WishlistItemSchema.index({ priorite: 1 });

module.exports = mongoose.model('WishlistItem', WishlistItemSchema);
