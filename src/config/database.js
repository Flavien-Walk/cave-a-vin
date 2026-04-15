const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'cave-a-vin',
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = { connectDB };
