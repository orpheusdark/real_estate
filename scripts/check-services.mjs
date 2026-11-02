import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
let failed = false;
const has = (key) => Boolean(process.env[key]?.trim());
if (!has('MONGODB_URI')) {
  console.log('MongoDB: enter MONGODB_URI in backend/.env');
  failed = true;
} else {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await mongoose.connection.db.command({ ping: 1 });
    console.log('MongoDB: connection and ping passed');
  } catch {
    console.log(
      'MongoDB: connection failed. Check the URI, database password and Atlas IP access list.',
    );
    failed = true;
  } finally {
    await mongoose.disconnect();
  }
}
if (!['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].every(has)) {
  console.log('Gmail: enter SMTP_USER, SMTP_PASS and SMTP_FROM in backend/.env');
  failed = true;
} else {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    await transport.verify();
    console.log('Email: SMTP connection and authentication passed; no email was sent');
  } catch {
    console.log('Email: SMTP verification failed. Check the app password and network access.');
    failed = true;
  } finally {
    transport.close();
  }
}
if (process.env.DEMO_MODE === 'true')
  console.log(
    'The app is still in demo mode. Switch DEMO_MODE to false after service checks pass. Image uploads will also require ImageKit.',
  );
process.exitCode = failed ? 1 : 0;
