const express = require('express');
const router = express.Router();
const Level = require('../models/Level');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const levels = await Level.find().sort({ number: 1 });
    res.json(levels);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const exists = await Level.findOne({ number: req.body.number });
    if (exists) return res.status(400).json({ error: 'رقم المستوى موجود مسبقاً' });
    const level = new Level(req.body);
    await level.save();
    res.status(201).json(level);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (req.body.number) {
      const dup = await Level.findOne({ number: req.body.number, _id: { $ne: req.params.id } });
      if (dup) return res.status(400).json({ error: 'رقم المستوى مستخدم' });
    }
    const level = await Level.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!level) return res.status(404).json({ error: 'غير موجود' });
    res.json(level);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;