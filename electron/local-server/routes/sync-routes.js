/**
 * routes/sync-routes.js — Sync status endpoint for the UI
 */

const express = require('express');
const { getDb } = require('../db');
const { getSyncStatus } = require('../sync');

const router = express.Router();

router.get('/status', (_req, res) => {
  try {
    const db      = getDb();
    const pending = db.prepare('SELECT COUNT(*) as c FROM sync_log WHERE synced=0').get().c;
    const status  = getSyncStatus();
    res.json({ success: true, data: { pending, ...status } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/upload', (_req, res) => {
  res.json({ success: true, data: { message: 'Upload handled by background service' } });
});

router.post('/mark-synced', (req, res) => {
  try {
    const db  = getDb();
    const ids = req.body.ids || [];
    if (ids.length) {
      db.prepare(`UPDATE sync_log SET synced=1 WHERE id IN (${ids.map(()=>'?').join(',')})`).run(...ids);
    }
    res.json({ success: true, data: { marked: ids.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
