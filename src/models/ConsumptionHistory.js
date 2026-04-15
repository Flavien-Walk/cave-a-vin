const mongoose = require('mongoose');

const ConsumptionHistorySchema = new mongoose.Schema({
  bottleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bottle', required: true, index: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  note:     { type: Number, min: 1, max: 5 },
  comment:  { type: String, trim: true, maxlength: 1000 },
  occasion: { type: String, trim: true, maxlength: 200 },
  date:     { type: Date, default: Date.now },
}, { timestamps: false });

ConsumptionHistorySchema.index({ date: -1 });

module.exports = mongoose.model('ConsumptionHistory', ConsumptionHistorySchema);
