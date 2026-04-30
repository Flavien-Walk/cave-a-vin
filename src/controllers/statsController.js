const Bottle = require('../models/Bottle');
const ConsumptionHistory = require('../models/ConsumptionHistory');

exports.getCaveValue = async (req, res, next) => {
  try {
    const uid = req.userId;

    const [aggregate, byCave, byColor] = await Promise.all([
      Bottle.aggregate([
        { $match: { userId: uid, quantite: { $gt: 0 } } },
        { $group: {
            _id: null,
            totalValue:   { $sum: { $multiply: ['$prixAchat', '$quantite'] } },
            totalBottles: { $sum: '$quantite' },
        }},
      ]),
      Bottle.aggregate([
        { $match: { userId: uid, cave: { $exists: true, $ne: '' }, quantite: { $gt: 0 } } },
        { $group: {
            _id:          '$cave',
            totalValue:   { $sum: { $multiply: ['$prixAchat', '$quantite'] } },
            totalBottles: { $sum: '$quantite' },
        }},
        { $sort: { totalValue: -1 } },
        { $project: { cave: '$_id', totalValue: { $round: ['$totalValue', 2] }, totalBottles: 1, _id: 0 } },
      ]),
      Bottle.aggregate([
        { $match: { userId: uid, quantite: { $gt: 0 } } },
        { $group: {
            _id:          '$couleur',
            totalValue:   { $sum: { $multiply: ['$prixAchat', '$quantite'] } },
            totalBottles: { $sum: '$quantite' },
        }},
        { $sort: { totalValue: -1 } },
        { $project: { couleur: '$_id', totalValue: { $round: ['$totalValue', 2] }, totalBottles: 1, _id: 0 } },
      ]),
    ]);

    res.json({
      totalValue:   Math.round((aggregate[0]?.totalValue   ?? 0) * 100) / 100,
      totalBottles: aggregate[0]?.totalBottles ?? 0,
      byCave,
      byColor,
    });
  } catch (err) { next(err); }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const uid  = req.userId;
    const year = new Date().getFullYear();

    const [aggregate, urgentPreview, favoritesPreview, recentBottles] = await Promise.all([
      Bottle.aggregate([
        { $match: { userId: uid } },
        { $group: {
            _id:             null,
            totalBottles:    { $sum: '$quantite' },
            totalReferences: { $sum: 1 },
            totalValue:      { $sum: { $multiply: ['$prixAchat', '$quantite'] } },
            favoritesCount:  { $sum: { $cond: ['$isFavorite', 1, 0] } },
            urgentCount:     { $sum: { $cond: [
              { $and: [{ $gt: ['$quantite', 0] }, { $lte: ['$consommerAvant', year + 1] }, { $gt: ['$consommerAvant', 0] }] },
              1, 0,
            ]}},
        }},
      ]),
      Bottle.find({ userId: uid, quantite: { $gt: 0 }, consommerAvant: { $exists: true, $gt: 0, $lte: year + 1 } })
        .sort({ consommerAvant: 1 }).limit(5).lean(),
      Bottle.find({ userId: uid, isFavorite: true, quantite: { $gt: 0 } })
        .sort({ createdAt: -1 }).limit(5).lean(),
      Bottle.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const agg = aggregate[0];
    res.json({
      totalBottles:    agg?.totalBottles    ?? 0,
      totalReferences: agg?.totalReferences ?? 0,
      totalValue:      Math.round((agg?.totalValue ?? 0) * 100) / 100,
      favoritesCount:  agg?.favoritesCount  ?? 0,
      urgentCount:     agg?.urgentCount     ?? 0,
      urgentPreview,
      favoritesPreview,
      recentBottles,
    });
  } catch (err) { next(err); }
};

exports.getSummary = async (req, res, next) => {
  try {
    const year    = new Date().getFullYear();
    const uid     = req.userId;

    const [aggregate] = await Bottle.aggregate([
      { $match: { userId: uid } },
      { $group: {
          _id: null,
          totalBottles:    { $sum: '$quantite' },
          totalReferences: { $sum: 1 },
          totalValue:      { $sum: { $multiply: ['$prixAchat', '$quantite'] } },
          favorites:       { $sum: { $cond: ['$isFavorite', 1, 0] } },
          urgent:          { $sum: { $cond: [{ $and: [
            { $gt: ['$quantite', 0] },
            { $lte: ['$consommerAvant', year] },
            { $gt: ['$consommerAvant', 0] },
          ] }, 1, 0] } },
      }},
    ]);

    const byColorRaw = await Bottle.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: '$couleur', count: { $sum: '$quantite' } } },
      { $sort: { count: -1 } },
    ]);
    const totalForColors = byColorRaw.reduce((s, c) => s + c.count, 0);
    const byColor = byColorRaw.map(c => ({
      couleur: c._id || 'autre', count: c.count,
      percentage: totalForColors > 0 ? Math.round((c.count / totalForColors) * 100) : 0,
    }));

    const byRegion = await Bottle.aggregate([
      { $match: { userId: uid, region: { $exists: true, $ne: '' } } },
      { $group: { _id: '$region', count: { $sum: '$quantite' } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $project: { region: '$_id', count: 1, _id: 0 } },
    ]);

    const byYear = await Bottle.aggregate([
      { $match: { userId: uid, annee: { $exists: true, $gt: 0 } } },
      { $group: { _id: '$annee', count: { $sum: '$quantite' } } },
      { $sort: { _id: -1 } }, { $limit: 15 },
      { $project: { annee: '$_id', count: 1, _id: 0 } },
    ]);

    const byCave = await Bottle.aggregate([
      { $match: { userId: uid, cave: { $exists: true, $ne: '' } } },
      { $group: { _id: '$cave', count: { $sum: '$quantite' } } },
      { $sort: { _id: 1 } },
      { $project: { cave: '$_id', count: 1, _id: 0 } },
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const [consumedThisMonth, consumedThisYear, consumedTotal] = await Promise.all([
      ConsumptionHistory.aggregate([{ $match: { userId: uid, date: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
      ConsumptionHistory.aggregate([{ $match: { userId: uid, date: { $gte: startOfYear  } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
      ConsumptionHistory.aggregate([{ $match: { userId: uid } },                               { $group: { _id: null, total: { $sum: '$quantity' } } }]),
    ]);

    res.json({
      totalBottles:    aggregate?.totalBottles    ?? 0,
      totalReferences: aggregate?.totalReferences ?? 0,
      totalValue:      Math.round((aggregate?.totalValue ?? 0) * 100) / 100,
      favorites:       aggregate?.favorites       ?? 0,
      urgent:          aggregate?.urgent          ?? 0,
      byColor, byRegion, byYear, byCave,
      consumed: {
        thisMonth: consumedThisMonth[0]?.total ?? 0,
        thisYear:  consumedThisYear[0]?.total  ?? 0,
        total:     consumedTotal[0]?.total     ?? 0,
      },
    });
  } catch (err) { next(err); }
};
