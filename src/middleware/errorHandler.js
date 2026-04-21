const notFound = (req, res, next) => {
  const err = new Error(`Route introuvable : ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Données invalides.', errors: messages });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ message: 'Identifiant invalide.' });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    // En production : loguer sans stack trace dans les logs serveur
    console.error(`[${new Date().toISOString()}] ${status} — ${err.message}`);
  }

  // Ne jamais exposer les détails internes d'une erreur 5xx en production
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    return res.status(status).json({ message: 'Erreur serveur interne.' });
  }

  res.status(status).json({
    message: err.message || 'Erreur serveur interne.',
  });
};

module.exports = { notFound, errorHandler };
