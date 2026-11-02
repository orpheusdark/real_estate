import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { createStore } from '../backend/src/store.js';
import { seedSampleProperties } from '../backend/src/seed.js';
if (!process.env.MONGODB_URI || !process.env.SMTP_USER)
  throw new Error('Configure the database and owner email first');
const store = await createStore({ demo: false });
try {
  const email = process.env.SMTP_USER.toLowerCase();
  let owner = await store.one('users', { email });
  if (!owner)
    owner = await store.create('users', {
      email,
      name: 'EstateIQ Owner',
      passwordHash: await bcrypt.hash(randomBytes(48).toString('base64url'), 12),
      tokenVersion: 0,
    });
  await seedSampleProperties(store, owner._id);
  console.log(
    'Sample homes available:',
    (await store.find('properties', { ownerId: owner._id, archived: false })).length,
  );
  console.log(
    'Owner access: use password reset with the configured sender address. No password or email has been sent.',
  );
} finally {
  await store.close();
}
