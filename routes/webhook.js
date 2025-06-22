const express = require('express');
const router  = express.Router();

// Verification endpoint
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Events endpoint
router.post('/webhook', (req, res) => {
  // Facebook will POST message events here
  console.log('Webhook event:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

module.exports = router;
