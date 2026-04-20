const UserCave = require('../models/UserCave');

// GET /api/caves — list all caves for the user
exports.getAll = async (req, res, next) => {
  try {
    const caves = await UserCave.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json(caves);
  } catch (err) { next(err); }
};

// POST /api/caves — create a new cave
exports.create = async (req, res, next) => {
  try {
    const { name, location, emplacements } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Le nom est obligatoire' });

    const existing = await UserCave.findOne({ userId: req.userId, name: name.trim() });
    if (existing) return res.status(409).json({ message: 'Une cave avec ce nom existe déjà' });

    const count = await UserCave.countDocuments({ userId: req.userId });
    const cave = await UserCave.create({
      userId: req.userId,
      name: name.trim(),
      location: location?.trim() || undefined,
      emplacements: Array.isArray(emplacements)
        ? emplacements.map(e => e.trim()).filter(Boolean)
        : [],
      isDefault: count === 0,
    });
    res.status(201).json(cave);
  } catch (err) { next(err); }
};

// PUT /api/caves/:id — update name/location/emplacements
exports.update = async (req, res, next) => {
  try {
    const cave = await UserCave.findOne({ _id: req.params.id, userId: req.userId });
    if (!cave) return res.status(404).json({ message: 'Cave non trouvée' });

    const { name, location, emplacements } = req.body;
    if (name !== undefined) cave.name = name.trim();
    if (location !== undefined) cave.location = location.trim();
    if (Array.isArray(emplacements)) {
      cave.emplacements = emplacements.map(e => e.trim()).filter(Boolean);
    }
    await cave.save();
    res.json(cave);
  } catch (err) { next(err); }
};

// DELETE /api/caves/:id — delete a cave
exports.remove = async (req, res, next) => {
  try {
    const cave = await UserCave.findOne({ _id: req.params.id, userId: req.userId });
    if (!cave) return res.status(404).json({ message: 'Cave non trouvée' });

    await cave.deleteOne();

    // If deleted cave was default, assign default to first remaining
    if (cave.isDefault) {
      const first = await UserCave.findOne({ userId: req.userId }).sort({ createdAt: 1 });
      if (first) { first.isDefault = true; await first.save(); }
    }
    res.json({ message: 'Cave supprimée' });
  } catch (err) { next(err); }
};

// PUT /api/caves/:id/default — set as default
exports.setDefault = async (req, res, next) => {
  try {
    await UserCave.updateMany({ userId: req.userId }, { isDefault: false });
    const cave = await UserCave.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDefault: true },
      { new: true }
    );
    if (!cave) return res.status(404).json({ message: 'Cave non trouvée' });
    res.json(cave);
  } catch (err) { next(err); }
};
