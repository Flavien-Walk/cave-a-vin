const mongoose = require('mongoose');

// ── Embedded schemas ─────────────────────────────────────────────────────────

const TastingNoteSchema = new mongoose.Schema({
  note:     { type: Number, required: true, min: 1, max: 5 },
  texte:    { type: String, trim: true, maxlength: 2000 },
  occasion: { type: String, trim: true, maxlength: 200 },
  date:     { type: Date, default: Date.now },
}, { _id: true });

// ── Main Bottle schema ────────────────────────────────────────────────────────

const BottleSchema = new mongoose.Schema({
  // ── Identité du vin ──
  nom:         { type: String, required: true, trim: true, maxlength: 300 },
  producteur:  { type: String, trim: true, maxlength: 300 },
  region:      { type: String, trim: true, maxlength: 200 },
  appellation: { type: String, trim: true, maxlength: 200 },
  annee:       { type: Number, min: 1800, max: 2100 },
  pays:        { type: String, trim: true, maxlength: 100 },
  cepage:      { type: String, trim: true, maxlength: 200 },

  couleur: {
    type: String,
    enum: ['rouge', 'blanc', 'rosé', 'effervescent', 'moelleux', 'autre'],
    default: 'rouge',
  },

  format: {
    type: String,
    enum: [
      'quart',
      'demi-bouteille',
      'bouteille',
      'magnum',
      'jéroboam',
      'réhoboam',
      'mathusalem',
      'salmanazar',
      'balthazar',
      'nabuchodonosor',
      'melchior',
      'solomon',
      'souverain',
      'primat',
      'melchizédec',
    ],
    default: 'bouteille',
  },

  // ── Stock ──
  quantite:    { type: Number, required: true, min: 0, default: 1 },

  // ── Emplacement ──
  cave:        { type: String, trim: true },
  emplacement: { type: String, trim: true },

  // ── Achat ──
  prixAchat:  { type: Number, min: 0 },
  lieuAchat:  { type: String, trim: true, maxlength: 300 },
  dateAchat:  { type: Date },

  // ── Garde ──
  consommerAvant:        { type: Number, min: 1900, max: 2200 },
  consommerApresOptimal: { type: Number, min: 1900, max: 2200 },

  // ── Médias ──
  photoUrl:      { type: String, trim: true },
  photoThumbUrl: { type: String, trim: true },

  // ── Statuts ──
  isFavorite: { type: Boolean, default: false },

  // ── Notes de dégustation (embedded) ──
  notes: { type: [TastingNoteSchema], default: [] },

  // ── Note personnelle ──
  notePerso: {
    texte: { type: String, trim: true, maxlength: 2000 },
    note:  { type: Number, min: 1, max: 5 },
    date:  { type: Date },
  },

  // ── Source ──
  source: {
    type: String,
    enum: ['manual', 'scan', 'import'],
    default: 'manual',
  },

  // ── Propriétaire ──
  userId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User', index: true },

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
BottleSchema.index({ nom: 'text', producteur: 'text', region: 'text', appellation: 'text' });
BottleSchema.index({ couleur: 1 });
BottleSchema.index({ cave: 1, emplacement: 1 });
BottleSchema.index({ annee: 1 });
BottleSchema.index({ isFavorite: 1 });
BottleSchema.index({ consommerAvant: 1 });
BottleSchema.index({ createdAt: -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
BottleSchema.virtual('isUrgent').get(function () {
  if (!this.consommerAvant || this.quantite === 0) return false;
  return this.consommerAvant <= new Date().getFullYear();
});

BottleSchema.virtual('averageNote').get(function () {
  if (!this.notes || this.notes.length === 0) return null;
  const sum = this.notes.reduce((acc, n) => acc + n.note, 0);
  return Math.round((sum / this.notes.length) * 10) / 10;
});

BottleSchema.set('toJSON', { virtuals: true });
BottleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bottle', BottleSchema);
