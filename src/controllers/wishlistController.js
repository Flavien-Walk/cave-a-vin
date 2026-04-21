const WishlistItem = require('../models/WishlistItem');

const WISHLIST_WRITABLE_FIELDS = [
  'nom', 'producteur', 'region', 'appellation', 'annee',
  'couleur', 'priorite', 'prixCible', 'note', 'url',
];

function pickWishlistFields(body) {
  return Object.fromEntries(
    WISHLIST_WRITABLE_FIELDS.filter(k => k in body).map(k => [k, body[k]])
  );
}

exports.getAll = async (req, res, next) => {
  try {
    const items = await WishlistItem.find({ userId: req.userId }).sort({ isPurchased: 1, createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const item = await WishlistItem.create({ ...pickWishlistFields(req.body), userId: req.userId });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await WishlistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: pickWishlistFields(req.body) },
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
