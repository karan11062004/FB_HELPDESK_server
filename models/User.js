
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
  },
  email: {
    type:     String,
    required: true,
    unique:   true,    // ← enforces uniqueness at the DB level
  },
  password: {
    type:     String,
    required: true,
  },
  fb: {
    pageId:      String,
    pageName:    String,
    accessToken: String,
    connectedAt: Date,
  },
});

module.exports = mongoose.model('User', UserSchema);

