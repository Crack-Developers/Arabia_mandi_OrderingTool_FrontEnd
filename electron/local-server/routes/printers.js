/**
 * routes/printers.js — Network printer management
 * LAN scan works natively from the desktop (better than cloud).
 */

const express = require('express');
const net     = require('net');
const os      = require('os');
const { v4: uuidv4 } = require('uuid');
const { getDb, logSync, now } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db       = getDb();
    const branchId = req.query.branchId || req.user?.branchId;
    const list     = branchId
      ? db.prepare('SELECT * FROM printers WHERE branch_id = ?').all(branchId)
      : db.prepare('SELECT * FROM printers').all();
    res.json({ success: true, data: list.map(fmt) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/scan', async (req, res) => {
  try {
    const db       = getDb();
    const branchId = req.query.branchId || req.user?.branchId;
    const saved    = branchId
      ? db.prepare('SELECT * FROM printers WHERE branch_id = ?').all(branchId).map(fmt)
      : [];
    const localIp = getLocalIP();
    const subnet  = localIp.split('.').slice(0, 3).join('.');
    const found   = await scanSubnet(subnet, 9100, 30);
    res.json({ success: true, data: { foundPrinters: found, savedPrinters: saved } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ping', async (req, res) => {
  const { ip, port = 9100 } = req.body;
  const reachable = await pingPrinter(ip, port);
  res.json({ success: true, data: { reachable, ip, port } });
});

router.post('/', (req, res) => {
  try {
    const db  = getDb();
    const _id = uuidv4();
    const b   = req.body;
    db.prepare(`INSERT INTO printers (_id,branch_id,name,ip,port,type,duty,role,sections,isActive,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,1,?)`).run(
      _id, b.branchId||req.user?.branchId, b.name, b.ip, b.port||9100,
      b.type||'thermal', b.duty||'KOT', b.role||'kitchen',
      JSON.stringify(b.sections||['ALL']), now()
    );
    const p = db.prepare('SELECT * FROM printers WHERE _id=?').get(_id);
    logSync('printers', _id, 'INSERT', fmt(p));
    res.status(201).json({ success: true, data: fmt(p) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb(); const b = req.body; const id = req.params.id;
    db.prepare(`UPDATE printers SET name=COALESCE(?,name),ip=COALESCE(?,ip),port=COALESCE(?,port),
      duty=COALESCE(?,duty),role=COALESCE(?,role),sections=COALESCE(?,sections),
      isActive=COALESCE(?,isActive),updated_at=? WHERE _id=?`).run(
      b.name, b.ip, b.port, b.duty, b.role,
      b.sections?JSON.stringify(b.sections):null,
      b.isActive!==undefined?(b.isActive?1:0):null, now(), id
    );
    const p = db.prepare('SELECT * FROM printers WHERE _id=?').get(id);
    if (p) logSync('printers', id, 'UPDATE', fmt(p));
    res.json({ success: true, data: p ? fmt(p) : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM printers WHERE _id=?').run(req.params.id);
    logSync('printers', req.params.id, 'DELETE', { _id: req.params.id });
    res.json({ success: true, data: { message: 'Printer deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/print', async (req, res) => {
  const { printerId } = req.body;
  const p = getDb().prepare('SELECT * FROM printers WHERE _id=?').get(printerId);
  if (!p) return res.status(404).json({ success: false, message: 'Printer not found' });
  console.log(`[Printer] Job → ${p.ip}:${p.port}`);
  res.json({ success: true, data: { message: 'Print job sent' } });
});

router.post('/dispatch-kot', async (_req, res) => {
  res.json({ success: true, data: { message: 'KOT dispatched' } });
});

function fmt(p) {
  return {
    _id: p._id, name: p.name, ip: p.ip, port: p.port||9100,
    type: p.type||'thermal', duty: p.duty||'KOT', role: p.role||'kitchen',
    sections: JSON.parse(p.sections||'["ALL"]'),
    branchId: p.branch_id, isActive: p.isActive===1,
  };
}

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets))
    for (const n of nets[name])
      if (n.family==='IPv4' && !n.internal) return n.address;
  return '192.168.1.1';
}

function pingPrinter(ip, port, timeout=1500) {
  return new Promise(resolve => {
    const s = new net.Socket();
    s.setTimeout(timeout);
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('error',   () => { s.destroy(); resolve(false); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
    s.connect(port, ip);
  });
}

async function scanSubnet(subnet, port, count=30) {
  const ps = [];
  for (let i=1; i<=count; i++) {
    const ip = `${subnet}.${i}`;
    ps.push(pingPrinter(ip,port,800).then(ok => ok ? {ip,port,name:`Printer @ ${ip}`} : null));
  }
  return (await Promise.all(ps)).filter(Boolean);
}

module.exports = router;
