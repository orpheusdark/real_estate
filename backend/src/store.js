import mongoose from 'mongoose';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { models } from './models.js';
const clone = (x) => JSON.parse(JSON.stringify(x));
function matches(row, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some((q) => matches(row, q));
    if (value && typeof value === 'object')
      return Object.entries(value).every(([op, v]) => {
        if (op === '$gt') return new Date(row[key]) > new Date(v);
        if (op === '$ne') return row[key] !== v;
        if (op === '$gte') return row[key] >= v;
        if (op === '$lte') return row[key] <= v;
        if (op === '$regex') return new RegExp(v, value.$options || '').test(row[key] || '');
        return op === '$options';
      });
    return row[key] === value;
  });
}
export async function createStore(config) {
  if (!config.demo) {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await Promise.all(Object.values(models).map((m) => m.init()));
    return {
      find: (table, q = {}) => models[table].find(q).lean(),
      pageProperties: async (query, sort, page, limit) => {
        const [items, total] = await Promise.all([
          models.properties
            .find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          models.properties.countDocuments(query),
        ]);
        return { items, total };
      },
      one: (table, q) => models[table].findOne(q).lean(),
      create: async (table, data) =>
        (await models[table].create({ ...data, _id: randomUUID() })).toObject(),
      update: (table, q, patch, unset = {}, increment = {}) =>
        models[table]
          .findOneAndUpdate(
            q,
            { $set: patch, $unset: unset, $inc: increment },
            { new: true, runValidators: true },
          )
          .lean(),
      close: () => mongoose.disconnect(),
    };
  }
  await mkdir(config.dataDir, { recursive: true });
  const file = path.join(config.dataDir, 'estateiq.json');
  let db;
  try {
    db = JSON.parse(await readFile(file, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    db = { users: [], properties: [], appointments: [] };
  }
  let writes = Promise.resolve();
  function persist() {
    const snapshot = JSON.stringify(db, null, 2);
    writes = writes.then(async () => {
      await writeFile(file + '.tmp', snapshot);
      await rename(file + '.tmp', file);
    });
    return writes;
  }
  return {
    find: async (table, q = {}) => clone(db[table].filter((x) => matches(x, q))),
    pageProperties: async (query, sort, page, limit) => {
      const rows = db.properties.filter((p) => matches(p, query));
      rows.sort((a, b) => {
        for (const [key, direction] of Object.entries(sort)) {
          const av = key === 'createdAt' ? Date.parse(a[key]) : a[key];
          const bv = key === 'createdAt' ? Date.parse(b[key]) : b[key];
          if (av < bv) return -direction;
          if (av > bv) return direction;
        }
        return 0;
      });
      return { items: clone(rows.slice((page - 1) * limit, page * limit)), total: rows.length };
    },
    one: async (table, q) => clone(db[table].find((x) => matches(x, q)) || null),
    create: async (table, data) => {
      if (
        (table === 'users' && db.users.some((x) => x.email === data.email)) ||
        (table === 'appointments' &&
          data.slotKey &&
          db.appointments.some((x) => x.slotKey === data.slotKey))
      ) {
        const e = new Error('Duplicate');
        e.code = 11000;
        throw e;
      }
      const row = {
        ...data,
        _id: randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db[table].push(row);
      await persist();
      return clone(row);
    },
    update: async (table, q, patch, unset = {}, increment = {}) => {
      const row = db[table].find((x) => matches(x, q));
      if (!row) return null;
      Object.assign(row, patch, { updatedAt: new Date().toISOString() });
      Object.keys(unset).forEach((k) => delete row[k]);
      Object.entries(increment).forEach(([k, v]) => (row[k] = (row[k] || 0) + v));
      await persist();
      return clone(row);
    },
    close: () => writes,
  };
}
