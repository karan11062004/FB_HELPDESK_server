// server/routes/facebook.js
const express   = require('express');
const axios     = require('axios');
const jwt       = require('jsonwebtoken');
const User      = require('../models/User');
const auth      = require('../middleware/auth');

const router = express.Router();

// 1) Kick off OAuth — verify JWT from query string
router.get('/connect', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).send('Missing token');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).send('Invalid token');
  }

  const userId = payload.id;
  const url = new URL('https://www.facebook.com/v16.0/dialog/oauth');
  url.searchParams.set('client_id',    process.env.FB_CLIENT_ID);
  url.searchParams.set('redirect_uri', process.env.FB_REDIRECT_URI);
  url.searchParams.set(
    'scope',
    'pages_read_engagement,pages_manage_metadata,pages_messaging'
  );
  url.searchParams.set('state', userId);

  return res.redirect(url.toString());
});

// 2) OAuth callback
router.get('/facebook/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  if (!code) return res.status(400).send('No code');

  try {
    // Exchange code for user access token
    const tokenRes = await axios.get(
      'https://graph.facebook.com/v16.0/oauth/access_token',
      {
        params: {
          client_id:     process.env.FB_CLIENT_ID,
          client_secret: process.env.FB_CLIENT_SECRET,
          redirect_uri:  process.env.FB_REDIRECT_URI,
          code,
        },
      }
    );
    const userToken = tokenRes.data.access_token;

    // Fetch Pages this user manages
    const pagesRes = await axios.get(
      'https://graph.facebook.com/v16.0/me/accounts',
      { params: { access_token: userToken } }
    );
    const page = pagesRes.data.data[0];
    if (!page) throw new Error('No FB Page found');

    // Persist in DB
    await User.findByIdAndUpdate(userId, {
      fb: {
        pageId:      page.id,
        pageName:    page.name,
        accessToken: page.access_token,
        connectedAt: new Date(),
      },
    });

    // Redirect back to client
    return res.redirect('http://localhost:3000/');
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).send('Facebook connect failed');
  }
});

// 3) List conversations
router.get('/conversations', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user.fb?.accessToken) {
    return res.status(400).json({ msg: 'Not connected' });
  }

  try {
    const conv = await axios.get(
      `https://graph.facebook.com/v16.0/${user.fb.pageId}/conversations`,
      { params: { access_token: user.fb.accessToken } }
    );
    return res.json(conv.data.data);
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ msg: 'Failed to fetch conversations' });
  }
});

// 4) Get messages in one thread
router.get(
  '/conversations/:threadId/messages',
  auth,
  async (req, res) => {
    const { threadId } = req.params;
    const user = await User.findById(req.userId);

    try {
      const msgs = await axios.get(
        `https://graph.facebook.com/v16.0/${threadId}/messages`,
        { params: { access_token: user.fb.accessToken } }
      );
      return res.json(msgs.data.data);
    } catch (err) {
      console.error(err.response?.data || err);
      return res.status(500).json({ msg: 'Failed to fetch messages' });
    }
  }
);

// 5) Send a reply
router.post(
  '/conversations/:threadId/messages',
  auth,
  async (req, res) => {
    const { threadId } = req.params;
    const { message }  = req.body;
    const user = await User.findById(req.userId);

    try {
      const send = await axios.post(
        `https://graph.facebook.com/v16.0/${threadId}/messages`,
        null,
        {
          params: {
            access_token: user.fb.accessToken,
            message,
          },
        }
      );
      return res.json(send.data);
    } catch (err) {
      console.error(err.response?.data || err);
      return res.status(500).json({ msg: 'Failed to send message' });
    }
  }
);

module.exports = router;
