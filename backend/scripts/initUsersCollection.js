require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

async function initUsersCollection() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const collectionName = User.collection.name;
  const existingCollections = await mongoose.connection.db
    .listCollections({ name: collectionName })
    .toArray();

  if (existingCollections.length === 0) {
    await User.createCollection();
    console.log(`Created ${collectionName} collection`);
  } else {
    console.log(`${collectionName} collection already exists`);
  }

  await User.syncIndexes();

  const indexes = await User.collection.indexes();
  console.log(`Indexes on ${collectionName}:`);
  indexes.forEach((index) => {
    console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
  });
}

initUsersCollection()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Users collection initialization complete');
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
