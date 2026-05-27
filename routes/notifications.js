const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

module.exports = (socketHandler) => {
  router.post('/', auth, adminOnly, async (req, res) => {
    try {
      const { title, body, target } = req.body;
      const notif = new Notification({ title, body, target, sent_at: new Date() });
      await notif.save();
      
      let users = [];
      if(target === 'all') users = await User.find();
      else if(target.startsWith('level')) {
        const lvl = target.replace('level','');
        users = await User.find({ role: 'student', level: lvl });
      } else {
        users = await User.find({ role: target });
      }
      
      users.forEach(u => socketHandler.notifyUser(u._id.toString(), { title, body }));
      
      res.status(201).json(notif);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  router.get('/', auth, adminOnly, async (req, res) => {
    try {
      const notifs = await Notification.find().sort({ sent_at: -1 }).limit(50);
      res.json(notifs);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  return router;
};