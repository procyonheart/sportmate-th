import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

// CLOUDINARY_URL env (cloudinary://key:secret@cloud) is auto-read by the SDK.
const enabled = Boolean(config.cloudinaryUrl);

// Accepts a data URL / base64 string and returns a hosted https URL.
// Falls back to returning the input unchanged when Cloudinary isn't configured
// (keeps local dev working without an account).
export async function uploadImage(dataUrl, folder = 'sportmate') {
  if (!dataUrl) return '';
  if (!enabled) return dataUrl;
  const res = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: 'image',
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  });
  return res.secure_url;
}
