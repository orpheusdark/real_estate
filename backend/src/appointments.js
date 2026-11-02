import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { parse, booking, fail } from './validation.js';
import { hashToken } from './auth.js';
export function publicAppointment(a) {
  const { _id, propertyId, propertyTitle, ownerId, userId, name, email, phone, startsAt, status } =
    a;
  return {
    id: _id,
    propertyId,
    propertyTitle,
    ownerId,
    userId,
    name,
    email,
    phone,
    startsAt,
    status,
  };
}
export function appointmentRouter(store, auth, mail, config) {
  const router = Router();
  const book = async (req, res) => {
    const data = parse(booking, req.body);
    data.startsAt = new Date(data.startsAt).toISOString();
    const p = await store.one('properties', { _id: req.params.id, archived: false });
    if (!p) fail(404, 'Property not found');
    if (p.ownerId === req.user?._id) fail(400, 'You cannot book your own property');
    const token = randomBytes(32).toString('hex');
    const a = await store.create('appointments', {
      ...data,
      propertyId: p._id,
      propertyTitle: p.title,
      ownerId: p.ownerId,
      userId: req.user?._id || null,
      status: 'pending',
      slotKey: `${p._id}:${data.startsAt}`,
      cancelHash: hashToken(token),
    });
    let emailSent = true;
    try {
      await mail({
        to: data.email,
        subject: 'Your EstateIQ viewing request',
        text: `Your viewing for ${p.title} is pending for ${new Date(data.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST. Manage or cancel it: ${config.frontend}/viewing?token=${token}`,
      });
    } catch {
      emailSent = false;
      console.error('Viewing email delivery failed');
    }
    res.status(201).json({ appointment: publicAppointment(a), manageToken: token, emailSent });
  };
  router.post('/properties/:id/appointments/guest', book);
  router.post('/properties/:id/appointments', auth.authenticate, book);
  router.get('/appointments/manage/:token', async (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.token)) fail(404, 'Viewing link not found');
    const a = await store.one('appointments', { cancelHash: hashToken(req.params.token) });
    if (!a) fail(404, 'Viewing link not found');
    res.json(publicAppointment(a));
  });
  router.post('/appointments/manage/:token/cancel', async (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.token)) fail(404, 'Viewing link not found');
    const a = await store.update(
      'appointments',
      { cancelHash: hashToken(req.params.token) },
      { status: 'cancelled' },
      { slotKey: 1 },
    );
    if (!a) fail(404, 'Viewing link not found');
    res.json(publicAppointment(a));
  });
  router.patch('/appointments/:id', auth.authenticate, async (req, res) => {
    const { status } = parse(z.object({ status: z.enum(['confirmed', 'cancelled']) }), req.body);
    const a = await store.one('appointments', { _id: req.params.id });
    if (!a) fail(404, 'Appointment not found');
    if (a.ownerId !== req.user._id && (a.userId !== req.user._id || status !== 'cancelled'))
      fail(403, 'You cannot change this viewing');
    if (a.status === 'cancelled') fail(409, 'Cancelled viewings cannot be reopened');
    if (new Date(a.startsAt) <= new Date()) fail(409, 'Past viewings cannot be changed');
    const updated = await store.update(
      'appointments',
      { _id: a._id, status: a.status },
      { status },
      status === 'cancelled' ? { slotKey: 1 } : {},
    );
    if (!updated) fail(409, 'Viewing changed. Refresh and retry');
    res.json(publicAppointment(updated));
  });
  return router;
}
