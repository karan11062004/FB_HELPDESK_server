const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ msg: 'Missing field' });

  try {
    // Check if user exists (case‑insensitive)
    const exists = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });

    if (exists)
      return res.status(400).json({ msg: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await new User({ name, email, password: hash }).save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token, name: user.name });
  } catch (err) {
    // Duplicate key error or other
    if (err.code === 11000)
      return res.status(400).json({ msg: 'Email aaalready in use' });
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: 'Missing field' });

  try {
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user)
      return res.status(400).json({ msg: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
