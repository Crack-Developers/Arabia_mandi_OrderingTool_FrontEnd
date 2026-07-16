/**
 * routes/branches.js
 * The desktop belongs to ONE branch. Returns local branch_config.
 * Admin creates branches on the cloud; the desktop downloads its own config.
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, logSync, now } = require('../db');

const router = express.Router();

// GET /api/v1/branches — returns this machine's branch
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const branch = db.prepare('SELECT * FROM branch_config LIMIT 1').get();
    // Return as array to match cloud API shape
    const list = branch ? [formatBranch(branch)] : [];
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/branches/:id
router.get('/:id', (req, res) => {
  try {
    const db     = getDb();
    const branch = db.prepare('SELECT * FROM branch_config WHERE _id = ?').get(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: formatBranch(branch) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/branches — create/update local branch config (first-time setup)
router.post('/', (req, res) => {
  try {
    const db   = getDb();
    const body = req.body;
    const _id  = body._id || uuidv4();

    db.prepare(`
      INSERT OR REPLACE INTO branch_config
        (_id, name, branchCode, address, phone, gst, cgst, sgst, serviceCharge,
         timings, cloud_branch_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      _id, body.name, body.branchCode || '', body.address || '', body.phone || '',
      body.gst || '', body.taxes?.cgst ?? 2.5, body.taxes?.sgst ?? 2.5,
      body.taxes?.serviceCharge ?? 0, body.timings || '', body.cloud_branch_id || _id, now()
    );

    const branch = db.prepare('SELECT * FROM branch_config WHERE _id = ?').get(_id);
    logSync('branch_config', _id, 'INSERT', formatBranch(branch));

    res.json({ success: true, data: formatBranch(branch) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/branches/:id
router.put('/:id', (req, res) => {
  try {
    const db   = getDb();
    const body = req.body;
    const id   = req.params.id;

    db.prepare(`
      UPDATE branch_config SET
        name = COALESCE(?, name), branchCode = COALESCE(?, branchCode),
        address = COALESCE(?, address), phone = COALESCE(?, phone),
        gst = COALESCE(?, gst), updated_at = ?
      WHERE _id = ?
    `).run(body.name, body.branchCode, body.address, body.phone, body.gst, now(), id);

    const branch = db.prepare('SELECT * FROM branch_config WHERE _id = ?').get(id);
    if (branch) logSync('branch_config', id, 'UPDATE', formatBranch(branch));

    res.json({ success: true, data: branch ? formatBranch(branch) : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/branches/:id/toggle-status — no-op locally (desktop is always active)
router.patch('/:id/toggle-status', (req, res) => {
  res.json({ success: true, data: { message: 'Status toggled' } });
});

// DELETE /api/v1/branches/:id — blocked on desktop
router.delete('/:id', (_req, res) => {
  res.status(403).json({ success: false, message: 'Cannot delete branch from desktop app' });
});

function formatBranch(b) {
  return {
    _id:        b._id,
    name:       b.name,
    branchCode: b.branchCode || '',
    address:    b.address || '',
    phone:      b.phone || '',
    gst:        b.gst || '',
    taxes: {
      cgst:          b.cgst ?? 2.5,
      sgst:          b.sgst ?? 2.5,
      serviceCharge: b.serviceCharge ?? 0,
    },
    timings:  b.timings || '',
    status:   'Active',
  };
}

module.exports = router;
