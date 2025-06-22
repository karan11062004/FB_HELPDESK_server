require('dotenv').config();
const express       = require('express');
const mongoose      = require('mongoose');
const cors          = require('cors');

const authRoutes    = require('./routes/auth');
const fbRoutes      = require('./routes/facebook');
const webhookRoutes = require('./routes/webhook');

const app  = express();
const PORT = process.env.PORT || 5000;

// 1) Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 2) Global middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json()); // parse JSON bodies

// 3) Routes
app.use('/api/auth', authRoutes);    // auth endpoints
app.use('/api/fb',   fbRoutes);      // FB Connect & messaging APIs
app.use('/webhook',  webhookRoutes); // Messenger webhook verify & events

// 4) Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
