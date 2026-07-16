/**
 * sync.js — Background Cloud Sync Service
 * Reads unsynced events from sync_log → POSTs to cloud → marks synced.
 * Runs every 30 seconds when internet is available.
 */

const CLOUD_API  = 'https://arabia-mandi-orderingtool-backend.onrender.com/api/v1';
const SYNC_INTERVAL_MS = 30_000;

let timer       = null;
let isSyncing   = false;
let lastSyncAt  = null;
let pendingCount = 0;

function getSyncStatus() {
  return { isSyncing, lastSyncAt, pendingCount };
}

function startSyncService() {
  if (timer) return;
  console.log('[Sync] Service started — interval:', SYNC_INTERVAL_MS / 1000, 's');
  // Run immediately, then on interval
  runSync();
  timer = setInterval(runSync, SYNC_INTERVAL_MS);
}

function stopSyncService() {
  if (timer) { clearInterval(timer); timer = null; }
  console.log('[Sync] Service stopped');
}

async function runSync() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    // Lazy-import to avoid circular dep at startup
    const { getDb } = require('./db');
    const db        = getDb();

    // Get unsynced events (batch of 100)
    const rows = db.prepare(
      'SELECT * FROM sync_log WHERE synced=0 ORDER BY id ASC LIMIT 100'
    ).all();

    pendingCount = db.prepare('SELECT COUNT(*) as c FROM sync_log WHERE synced=0').get().c;

    if (!rows.length) {
      isSyncing = false;
      return;
    }

    // Get cloud token from branch_config
    const branch = db.prepare('SELECT cloud_token FROM branch_config LIMIT 1').get();
    const token  = branch?.cloud_token;
    if (!token) {
      console.warn('[Sync] No cloud token stored — skipping sync');
      isSyncing = false;
      return;
    }

    // Check internet connectivity first
    const online = await checkOnline();
    if (!online) {
      console.log('[Sync] Offline — skipping this cycle');
      isSyncing = false;
      return;
    }

    // POST batch to cloud
    const fetch    = require('node-fetch');
    const payload  = rows.map(r => ({
      id:        r.id,
      table:     r.table_name,
      recordId:  r.record_id,
      action:    r.action,
      payload:   JSON.parse(r.payload),
      createdAt: r.created_at,
    }));

    const response = await fetch(`${CLOUD_API}/sync/upload`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body:    JSON.stringify({ items: payload }),
      timeout: 10_000,
    });

    if (response.ok) {
      // Mark all as synced
      const ids = rows.map(r => r.id);
      db.prepare(
        `UPDATE sync_log SET synced=1 WHERE id IN (${ids.map(() => '?').join(',')})`
      ).run(...ids);

      lastSyncAt   = new Date().toISOString();
      pendingCount = db.prepare('SELECT COUNT(*) as c FROM sync_log WHERE synced=0').get().c;
      console.log(`[Sync] ✓ Pushed ${rows.length} events to cloud. Pending: ${pendingCount}`);
    } else {
      const txt = await response.text().catch(() => '');
      console.warn('[Sync] Cloud rejected batch:', response.status, txt.slice(0, 200));
    }
  } catch (err) {
    console.warn('[Sync] Cycle error:', err.message);
  } finally {
    isSyncing = false;
  }
}

async function checkOnline() {
  try {
    const fetch = require('node-fetch');
    const res   = await fetch('https://1.1.1.1', { method: 'HEAD', timeout: 3000 });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

module.exports = { startSyncService, stopSyncService, getSyncStatus, runSync };
