const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 100 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

// Hash avant sauvegarde
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.methods.toPublic = function () {
  return { _id: this._id, name: this.name, email: this.email, createdAt: this.createdAt };
};

module.exports = mongoose.model('User', UserSchema);
