const Bottle = require('../models/Bottle');
const ConsumptionHistory = require('../models/ConsumptionHistory');

const owns = async (id, userId) => {
  const b = await Bottle.findOne({ _id: id, userId });
  return b;
};

// ── GET /api/bottles ─────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const bottles = await Bottle.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(bottles);
  } catch (err) { next(err); }
};

// ── GET /api/bottles/:id ─────────────────────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const bottle = await Bottle.findOne({ _id: req.params.id, userId: req.userId });
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    res.json(bottle);
  } catch (err) { next(err); }
};

// ── POST /api/bottles ────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const bottle = await Bottle.create({ ...req.body, userId: req.userId });
    res.status(201).json(bottle);
  } catch (err) { next(err); }
};

// ── PUT /api/bottles/:id ─────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const bottle = await Bottle.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    res.json(bottle);
  } catch (err) { next(err); }
};

// ── DELETE /api/bottles/:id ───────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const bottle = await Bottle.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    await ConsumptionHistory.deleteMany({ bottleId: req.params.id });
    res.json({ message: 'Bouteille supprimée.' });
  } catch (err) { next(err); }
};

// ── PUT /api/bottles/:id/favorite ────────────────────────────────────────────
exports.toggleFavorite = async (req, res, next) => {
  try {
    const bottle = await owns(req.params.id, req.userId);
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    bottle.isFavorite = !bottle.isFavorite;
    await bottle.save();
    res.json(bottle);
  } catch (err) { next(err); }
};

// ── POST /api/bottles/:id/drink ──────────────────────────────────────────────
exports.drink = async (req, res, next) => {
  try {
    const bottle = await owns(req.params.id, req.userId);
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    const qty = req.body.quantity || 1;
    if (bottle.quantite < qty)
      return res.status(400).json({ message: `Stock insuffisant (${bottle.quantite} disponible).` });
    bottle.quantite -= qty;
    await bottle.save();
    const entry = await ConsumptionHistory.create({
      bottleId: bottle._id, userId: req.userId,
      quantity: qty, note: req.body.note,
      comment: req.body.comment, occasion: req.body.occasion,
      date: req.body.date || new Date(),
    });
    res.json({ bottle, entry });
  } catch (err) { next(err); }
};

// ── GET /api/bottles/:id/history ─────────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const history = await ConsumptionHistory
      .find({ bottleId: req.params.id, userId: req.userId })
      .sort({ date: -1 });
    res.json(history);
  } catch (err) { next(err); }
};

// ── POST /api/bottles/:id/notes ──────────────────────────────────────────────
exports.addNote = async (req, res, next) => {
  try {
    const bottle = await owns(req.params.id, req.userId);
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    bottle.notes.push({ note: req.body.note, texte: req.body.texte, occasion: req.body.occasion, date: req.body.date || new Date() });
    await bottle.save();
    res.status(201).json(bottle);
  } catch (err) { next(err); }
};

// ── DELETE /api/bottles/:id/notes/:noteId ────────────────────────────────────
exports.deleteNote = async (req, res, next) => {
  try {
    const bottle = await owns(req.params.id, req.userId);
    if (!bottle) return res.status(404).json({ message: 'Bouteille introuvable.' });
    bottle.notes = bottle.notes.filter(n => n._id.toString() !== req.params.noteId);
    await bottle.save();
    res.json(bottle);
  } catch (err) { next(err); }
};

// ── GET /api/bottles/recommend ───────────────────────────────────────────────
exports.recommend = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const recommendations = await Bottle.find({
      userId: req.userId, quantite: { $gt: 0 },
      consommerAvant: { $lte: year + 2, $gte: year - 1 },
    }).sort({ consommerAvant: 1 }).limit(10);
    res.json(recommendations);
  } catch (err) { next(err); }
};

// ── POST /api/bottles/suggest-wine ───────────────────────────────────────────
exports.suggestWine = async (req, res, next) => {
  try {
    const { plat } = req.body;
    if (!plat) return res.status(400).json({ message: 'Champ "plat" requis.' });
    const platLower = plat.toLowerCase();
    let couleurs = ['rouge'];
    if (/poisson|saumon|cabillaud|thon|crevette|homard/.test(platLower)) couleurs = ['blanc', 'effervescent'];
    else if (/salade|légume|chèvre|fromage frais/.test(platLower)) couleurs = ['blanc', 'rosé'];
    else if (/agneau|bœuf|canard|gibier|magret/.test(platLower)) couleurs = ['rouge'];
    else if (/dessert|tarte|gâteau|chocolat/.test(platLower)) couleurs = ['effervescent', 'moelleux'];
    else if (/foie gras/.test(platLower)) couleurs = ['moelleux', 'effervescent'];
    const bottles = await Bottle.find({ userId: req.userId, quantite: { $gt: 0 }, couleur: { $in: couleurs } })
      .sort({ 'notes.note': -1 }).limit(5);
    res.json({ plat, suggestions: couleurs, bottles });
  } catch (err) { next(err); }
};

// ── POST /bottles/scan-label ─────────────────────────────────────────────────
exports.scanLabel = async (req, res, next) => {
  try {
    // Simple regex-based extraction from any text field if Google Vision is not configured
    // Returns partial data with confidence score
    const text = req.body.text || '';
    const result = extractFromText(text);
    res.json(result);
  } catch (err) { next(err); }
};

function extractFromText(text) {
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  const allText = lines.join(' ');

  // Année (4 chiffres entre 1900-2030)
  const yearMatch = allText.match(/\b(19[0-9]{2}|20[0-2][0-9]|2030)\b/);
  const annee = yearMatch ? parseInt(yearMatch[1]) : null;

  // Couleur
  let couleur = null;
  if (/blanc|white|chardonnay|sauvignon|riesling|viognier|chablis|meursault|pouilly/i.test(allText)) couleur = 'blanc';
  else if (/rosé|rose|provence/i.test(allText)) couleur = 'rosé';
  else if (/champagne|crémant|mousseux|prosecco|cava|effervescent|brut|extra[- ]brut/i.test(allText)) couleur = 'effervescent';
  else if (/sauternes|barsac|moelleux|liquoreux|vendange tardive/i.test(allText)) couleur = 'moelleux';
  else if (/rouge|red|pinot noir|cabernet|merlot|syrah|grenache|malbec/i.test(allText)) couleur = 'rouge';

  // Région
  const REGIONS = ['Bordeaux','Bourgogne','Champagne','Vallée du Rhône','Alsace','Languedoc','Provence',
    'Loire','Jura','Savoie','Corse','Sud-Ouest','Beaujolais','Rhône','Médoc','Saint-Émilion','Pomerol',
    'Sancerre','Pouilly-Fumé','Chablis','Meursault','Gevrey','Pommard','Volnay'];
  let region = null;
  for (const r of REGIONS) {
    if (allText.toLowerCase().includes(r.toLowerCase())) { region = r; break; }
  }

  // Appellation
  const APPELLATIONS = ['Saint-Julien','Margaux','Pauillac','Saint-Estèphe','Saint-Émilion','Pomerol',
    'Châteauneuf-du-Pape','Hermitage','Côte-Rôtie','Sancerre','Chablis','Meursault','Volnay','Pommard',
    'Gevrey-Chambertin','Chambolle-Musigny','Nuits-Saint-Georges'];
  let appellation = null;
  for (const a of APPELLATIONS) {
    if (allText.toLowerCase().includes(a.toLowerCase())) { appellation = a; break; }
  }

  // Nom/producteur — prendre les premières lignes significatives
  const nomCandidates = lines.filter(l => l.length > 3 && l.length < 80 && !/^\d+/.test(l)
    && !/cl|ml|vol|alc|%|www\.|http/i.test(l));
  const nom = nomCandidates[0] || null;
  const producteur = nomCandidates[1] || null;

  // Score de confiance
  let confidence = 0;
  if (nom) confidence += 25;
  if (annee) confidence += 20;
  if (couleur) confidence += 20;
  if (region || appellation) confidence += 20;
  if (producteur) confidence += 15;

  const detected = [nom && 'nom', annee && 'millésime', couleur && 'couleur',
    (region || appellation) && 'région', producteur && 'producteur'].filter(Boolean);

  return {
    nom, producteur, annee, couleur, region, appellation,
    confidence, detected,
    partial: confidence < 100 && confidence > 0,
    message: confidence >= 70
      ? 'Étiquette bien reconnue — vérifiez les informations.'
      : confidence >= 35
        ? `Reconnaissance partielle — ${detected.join(', ')} détecté(s).`
        : 'Texte insuffisant — complétez manuellement.',
  };
}
