import mongoose from 'mongoose';
const { Schema } = mongoose;
const base = { _id: String };
const options = { versionKey: false, timestamps: true };
const user = new Schema(
  {
    ...base,
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    tokenVersion: { type: Number, default: 0 },
    resetHash: String,
    resetExpires: Date,
  },
  options,
);
const property = new Schema(
  {
    ...base,
    ownerId: { type: String, index: true },
    sampleKey: { type: String, index: true },
    title: String,
    description: String,
    location: String,
    address: String,
    type: String,
    purpose: String,
    price: Number,
    area: Number,
    bedrooms: Number,
    bathrooms: Number,
    amenities: [String],
    images: [{ _id: false, url: String, fileId: String }],
    archived: { type: Boolean, default: false },
  },
  options,
);
property.index({ location: 1, type: 1, price: 1 });
const appointment = new Schema(
  {
    ...base,
    propertyId: { type: String, index: true },
    propertyTitle: String,
    ownerId: { type: String, index: true },
    userId: { type: String, index: true },
    name: String,
    email: String,
    phone: String,
    startsAt: Date,
    status: String,
    slotKey: String,
    cancelHash: String,
  },
  options,
);
appointment.index(
  { slotKey: 1 },
  { unique: true, partialFilterExpression: { slotKey: { $type: 'string' } } },
);
export const models = {
  users: mongoose.model('User', user),
  properties: mongoose.model('Property', property),
  appointments: mongoose.model('Appointment', appointment),
};
