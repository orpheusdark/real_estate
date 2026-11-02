import { Router } from 'express';
import { parse, property, fail } from './validation.js';
import { upload } from './images.js';
export const publicProperty = (p) => {
  const {
    _id,
    ownerId,
    title,
    description,
    location,
    address,
    type,
    purpose,
    price,
    area,
    bedrooms,
    bathrooms,
    amenities,
    images,
    createdAt,
  } = p;
  return {
    id: _id,
    ownerId,
    title,
    description,
    location,
    address,
    type,
    purpose,
    price,
    area,
    bedrooms,
    bathrooms,
    amenities,
    images,
    createdAt,
  };
};
export function propertyRouter(store, auth, images) {
  const router = Router();
  const owned = async (req, res, next) => {
    const p = await store.one('properties', { _id: req.params.id, archived: false });
    if (!p) fail(404, 'Property not found');
    if (p.ownerId !== req.user._id) fail(403, 'You can only manage your own properties');
    req.property = p;
    next();
  };
  router.get('/', async (req, res) => {
    const q = req.query;
    const allowed = [
      'q',
      'location',
      'type',
      'purpose',
      'minPrice',
      'maxPrice',
      'minArea',
      'maxArea',
      'bedrooms',
      'sort',
      'page',
      'limit',
    ];
    if (Object.keys(q).some((k) => !allowed.includes(k) || typeof q[k] !== 'string'))
      fail(400, 'Invalid filter');
    for (const key of ['minPrice', 'maxPrice', 'minArea', 'maxArea', 'bedrooms', 'page', 'limit'])
      if (q[key] !== undefined && (!Number.isFinite(Number(q[key])) || Number(q[key]) < 0))
        fail(400, 'Filters must use positive numbers');
    for (const key of ['q', 'location']) if (q[key]?.length > 100) fail(400, 'Search is too long');
    const page = Math.max(1, Math.floor(Number(q.page) || 1)),
      limit = Math.min(24, Math.max(1, Math.floor(Number(q.limit) || 9)));
    const literal = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = { archived: false };
    if (q.q)
      query.$or = ['title', 'location', 'description'].map((key) => ({
        [key]: { $regex: literal(q.q), $options: 'i' },
      }));
    if (q.location) query.location = { $regex: literal(q.location), $options: 'i' };
    if (q.type) query.type = q.type;
    if (q.purpose) query.purpose = q.purpose;
    for (const [field, min, max] of [
      ['price', 'minPrice', 'maxPrice'],
      ['area', 'minArea', 'maxArea'],
    ]) {
      if (q[min] || q[max])
        query[field] = {
          ...(q[min] ? { $gte: Number(q[min]) } : {}),
          ...(q[max] ? { $lte: Number(q[max]) } : {}),
        };
    }
    if (q.bedrooms) query.bedrooms = { $gte: Number(q.bedrooms) };
    const sort =
      q.sort === 'price-asc'
        ? { price: 1, _id: 1 }
        : q.sort === 'price-desc'
          ? { price: -1, _id: 1 }
          : { createdAt: -1, _id: 1 };
    const { items, total } = await store.pageProperties(query, sort, page, limit);
    res.json({ items: items.map(publicProperty), total, page, pages: Math.ceil(total / limit) });
  });
  router.get('/:id', async (req, res) => {
    const p = await store.one('properties', { _id: req.params.id, archived: false });
    if (!p) fail(404, 'Property not found');
    res.json(publicProperty(p));
  });
  router.post('/', auth.authenticate, async (req, res) => {
    const data = parse(property, req.body);
    const p = await store.create('properties', {
      ...data,
      ownerId: req.user._id,
      images: [],
      archived: false,
    });
    res.status(201).json(publicProperty(p));
  });
  router.patch('/:id', auth.authenticate, owned, async (req, res) => {
    const data = parse(property, req.body);
    const p = await store.update(
      'properties',
      { _id: req.params.id, ownerId: req.user._id, archived: false },
      data,
    );
    if (!p) fail(409, 'Property changed. Refresh and retry');
    res.json(publicProperty(p));
  });
  router.delete('/:id', auth.authenticate, owned, async (req, res) => {
    await store.update('properties', { _id: req.params.id }, { archived: true });
    const pending = await store.find('appointments', { propertyId: req.params.id });
    for (const a of pending)
      if (a.status !== 'cancelled')
        await store.update('appointments', { _id: a._id }, { status: 'cancelled' }, { slotKey: 1 });
    res.json({ message: 'Listing removed and viewings cancelled' });
  });
  router.post('/:id/images', auth.authenticate, owned, upload, async (req, res) => {
    if (!req.files?.length) fail(400, 'Choose JPEG, PNG or WebP images, up to 4 MB each');
    if (req.property.images.length + req.files.length > 4)
      fail(400, 'A property can have up to four images');
    const saved = [];
    try {
      for (const file of req.files) saved.push(await images.save(file));
      const p = await store.update(
        'properties',
        { _id: req.params.id, archived: false, updatedAt: req.property.updatedAt },
        { images: [...req.property.images, ...saved] },
      );
      if (!p) fail(409, 'Listing changed. Refresh and try again');
      res.status(201).json(publicProperty(p));
    } catch (e) {
      await Promise.allSettled(saved.map((x) => images.remove(x)));
      throw e;
    }
  });
  router.delete('/:id/images/:fileId', auth.authenticate, owned, async (req, res) => {
    const image = req.property.images.find((x) => x.fileId === req.params.fileId);
    if (!image) fail(404, 'Image not found');
    const p = await store.update(
      'properties',
      { _id: req.params.id, archived: false, updatedAt: req.property.updatedAt },
      { images: req.property.images.filter((x) => x.fileId !== image.fileId) },
    );
    if (!p) fail(409, 'Listing changed. Refresh and try again');
    await images.remove(image).catch(() => console.error('Image cleanup requires retry'));
    res.json(publicProperty(p));
  });
  return router;
}
