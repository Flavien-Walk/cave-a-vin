const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'cave-a-vin',
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  // Migration : remplace l'index unique { userId, name } par { userId, name, location }
  // pour autoriser le même nom de cave dans des lieux différents
  try {
    const col = mongoose.connection.collection('usercaves');
    const indexes = await col.indexes();
    const old = indexes.find(idx =>
      idx.unique &&
      Object.keys(idx.key).sort().join(',') === 'name,userId' &&
      !idx.key.location
    );
    if (old) {
      await col.dropIndex(old.name);
      console.log('Migration: ancien index unique { userId, name } supprimé');
    }
  } catch (err) {
    console.warn('Migration index (non-bloquant):', err.message);
  }
};

module.exports = { connectDB };
