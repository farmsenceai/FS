require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB FarmsenceAI
connectDB();

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`🚀 FarmsenceAI Server listening on ${PORT}`);
});
