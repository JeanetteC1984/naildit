/* Shared data checks, also exercised by the dependency-free regression suite. */
(function (root) {
  'use strict';
  const collections = ['orders', 'appointments', 'inventory', 'expenses', 'ideas', 'recipes', 'production', 'campaigns', 'invoices', 'needs', 'supplyOrders', 'products'];
  const required = { orders: ['customer'], appointments: ['client'], inventory: ['name'], expenses: ['category'], ideas: ['title'], recipes: ['productName'], production: ['productName'], campaigns: ['name'], invoices: ['customerName'], needs: ['item'], supplyOrders: [], products: ['name'] };
  const numeric = new Set(['total', 'duration', 'qty', 'reorder', 'cost', 'amount', 'sellPrice', 'qtyMade', 'totalCost', 'budget', 'unitPrice', 'qtyUsed', 'unitCost']);
  const arrays = { recipes: 'components', production: 'components', invoices: 'items', supplyOrders: 'items' };
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function validateRecord(record, label) {
    if (!object(record)) throw new Error(`Invalid ${label} record`);
    for (const [key, value] of Object.entries(record)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Unsafe record key');
      if (numeric.has(key)) {
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid ${label}.${key}`);
      } else if (['items', 'components', 'tags', 'gallery'].includes(key) && Array.isArray(value)) {
        value.forEach(entry => {
          if (key === 'tags' || key === 'gallery') { if (typeof entry !== 'string') throw new Error(`Invalid ${key}`); }
          else validateRecord(entry, key);
        });
      } else if (key === 'isCustom') {
        if (typeof value !== 'boolean') throw new Error('Invalid custom-order flag');
      } else if (value !== null && typeof value !== 'string') throw new Error(`Invalid ${label}.${key}`);
    }
  }
  function validateBackup(parsed) {
    const incoming = object(parsed) && parsed.data ? parsed.data : parsed;
    if (!object(incoming) || !collections.some(name => Object.hasOwn(incoming, name))) throw new Error('No operations collections found');
    for (const name of collections) {
      if (!Object.hasOwn(incoming, name)) continue; // Older backups may omit newer collections.
      if (!Array.isArray(incoming[name])) throw new Error(`Invalid ${name} collection`);
      const ids = new Set();
      for (const record of incoming[name]) {
        validateRecord(record, name);
        if (typeof record.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(record.id) || ids.has(record.id)) throw new Error(`Invalid or duplicate ${name} ID`);
        ids.add(record.id);
        for (const key of required[name]) if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Missing ${name}.${key}`);
        if (arrays[name] && !Array.isArray(record[arrays[name]])) throw new Error(`Missing ${name}.${arrays[name]}`);
        if (arrays[name]) for (const line of record[arrays[name]]) {
          const quantity = name === 'production' ? 'qtyUsed' : 'qty';
          if (!Number.isFinite(line[quantity]) || line[quantity] <= 0) throw new Error('Invalid line quantity');
          if (name !== 'invoices' && typeof line.itemId !== 'string') throw new Error('Missing supply reference');
          if (name === 'invoices' && (typeof line.description !== 'string' || !Number.isFinite(line.unitPrice))) throw new Error('Invalid invoice line');
        }
        for (const key of ['tags', 'gallery']) if (record[key] != null && !Array.isArray(record[key])) throw new Error(`Invalid ${key}`);
      }
    }
    if (parsed.settings !== undefined && (!object(parsed.settings) || Object.values(parsed.settings).some(v => typeof v !== 'string'))) throw new Error('Invalid settings');
    for (const key of ['marketingNotes', 'dashboardNotes']) if (parsed[key] !== undefined && typeof parsed[key] !== 'string') throw new Error('Invalid notes');
    return incoming;
  }
  function writeTransaction(storage, entries) {
    const previous = entries.map(([key]) => [key, storage.getItem(key)]);
    try { for (const [key, value] of entries) storage.setItem(key, value); }
    catch (error) {
      for (const [key, value] of previous) {
        try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* Preserve the original failure. */ }
      }
      throw error;
    }
  }
  function supplySnapshot(line, inventory) {
    const item = inventory.find(item => item.id === line.itemId);
    return { ...line, unitCost: line.unitCost ?? Number(item?.cost || 0), itemName: line.itemName ?? item?.name ?? 'Deleted item', supplier: line.supplier ?? item?.supplier ?? '' };
  }
  const api = { validateBackup, writeTransaction, supplySnapshot };
  if (typeof module !== 'undefined') module.exports = api;
  else root.OpsIntegrity = api;
})(globalThis);
