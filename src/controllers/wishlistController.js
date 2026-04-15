const WishlistItem = require('../models/WishlistItem');

exports.getAll = async (req, res, next) => {
  try {
    const items = await WishlistItem.find({ userId: req.userId }).sort({ isPurchased: 1, createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const item = await WishlistItem.create({ ...req.body, userId: req.userId });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await WishlistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Élément introuvable.' });
    res.json(item);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await WishlistItem.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: 'Élément introuvable.' });
    res.json({ message: 'Élément supprimé.' });
  } catch (err) { next(err); }
};

exports.markPurchased = async (req, res, next) => {
  try {
    const item = await WishlistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isPurchased: true, purchasedAt: new Date() } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Élément introuvable.' });
    res.json(item);
  } catch (err) { next(err); }
};
