import bcrypt from 'bcryptjs';
import samples from '../../shared/sample-properties.json' with { type: 'json' };
// Refresh only illustrative listings owned by the dedicated local demo account.
export async function seedDemo(store) {
  let owner = await store.one('users', { email: 'demo@estateiq.local' });
  if (!owner)
    owner = await store.create('users', {
      name: 'EstateIQ Demo',
      email: 'demo@estateiq.local',
      passwordHash: await bcrypt.hash('ExploreEstate2026!', 12),
      tokenVersion: 0,
    });
  return seedSampleProperties(store, owner._id);
}
export async function seedSampleProperties(store, ownerId) {
  const existing = await store.find('properties', { ownerId });
  for (const sample of samples) {
    const { id, createdAt, ...fields } = sample;
    const data = { ...fields, ownerId };
    const old = existing.find((p) => p.sampleKey === sample.sampleKey || p.title === sample.title);
    if (old) {
      if (old.archived) continue;
      const patch = {
        description: data.description,
        images: data.images,
        amenities: data.amenities,
        sampleKey: data.sampleKey,
      };
      if (
        JSON.stringify(old.images) !== JSON.stringify(patch.images) ||
        old.description !== patch.description ||
        old.sampleKey !== sample.sampleKey
      )
        await store.update('properties', { _id: old._id }, patch);
    } else await store.create('properties', { ...data, archived: false });
  }
}
