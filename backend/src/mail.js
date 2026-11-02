import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export function createMailer(config) {
  const transport = config.demo
    ? null
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000,
        socketTimeout: 15000,
      });
  return async ({ to, subject, text }) => {
    if (config.demo) {
      const dir = path.join(config.dataDir, 'outbox');
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `${Date.now()}-${randomUUID()}.json`),
        JSON.stringify({ to, subject, text }, null, 2),
      );
      return;
    }
    await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  };
}
