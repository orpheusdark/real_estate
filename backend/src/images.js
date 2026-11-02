import multer from 'multer';
import sharp from 'sharp';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fail } from './validation.js';
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 4, fields: 0 },
  fileFilter: (req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Choose JPEG, PNG or WebP images'), { status: 400 })),
}).array('images', 4);
export function imageService(config) {
  const auth = 'Basic ' + Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
  return {
    async save(file) {
      let buffer;
      try {
        buffer = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        fail(400, 'Upload a valid JPEG, PNG or WebP image');
      }
      const name = randomUUID() + '.webp';
      if (config.demo) {
        await mkdir(config.uploadDir, { recursive: true });
        await writeFile(path.join(config.uploadDir, name), buffer);
        return { url: `${config.api}/uploads/${name}`, fileId: name };
      }
      const form = new FormData();
      form.append('file', new Blob([buffer], { type: 'image/webp' }), name);
      form.append('fileName', name);
      form.append('folder', '/estateiq/properties');
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: { Authorization: auth },
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) fail(502, 'Image storage is temporarily unavailable');
      const data = await response.json();
      return { url: data.url, fileId: data.fileId };
    },
    async remove(image) {
      if (image.fileId.startsWith('seed-')) return;
      if (config.demo) {
        if (!/^[a-f0-9-]+\.webp$/.test(image.fileId)) return;
        await unlink(path.join(config.uploadDir, image.fileId)).catch((e) => {
          if (e.code !== 'ENOENT') throw e;
        });
        return;
      }
      const res = await fetch(
        `https://api.imagekit.io/v1/files/${encodeURIComponent(image.fileId)}`,
        { method: 'DELETE', headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok && res.status !== 404) throw new Error('Image cleanup failed');
    },
  };
}
