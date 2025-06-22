const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: 'No auth header' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};
