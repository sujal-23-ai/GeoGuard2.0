const multer = require('multer');
const { uploadMedia, moderateContent, getThumbnailUrl, getLowResUrl, isConfigured } = require('../services/cloudinary.service');

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm',
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
  fileFilter: (_, file, cb) => cb(null, ALLOWED_MIME.includes(file.mimetype)),
});

const PLACEHOLDER = (i, mime) => ({
  url: `https://placehold.co/800x600/1a2235/3B82F6?text=Media+${i + 1}`,
  thumbnail: `https://placehold.co/400x300/1a2235/3B82F6?text=Thumbnail`,
  lowRes: `https://placehold.co/40x30/1a2235/3B82F6?text=LQ`,
  type: mime.startsWith('video/') ? 'video' : 'image',
  isSensitive: false,
  fallback: true,
});

const uploadFiles = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    if (!isConfigured()) {
      return res.json({
        urls: req.files.map((f, i) => PLACEHOLDER(i, f.mimetype)),
        fallback: true,
      });
    }

    const results = await Promise.all(
      req.files.map(async (file) => {
        const isVideo = file.mimetype.startsWith('video/');
        const result = await uploadMedia(file.buffer, {
          resource_type: isVideo ? 'video' : 'image',
          ...(isVideo && {
            eager: [{ format: 'jpg', transformation: [{ width: 600, crop: 'scale' }] }],
            eager_async: true,
          }),
        });

        const [moderation] = await Promise.all([moderateContent(result.secure_url)]);
        const thumbnail = getThumbnailUrl(result.secure_url, isVideo ? 'video' : 'image');
        const lowRes = getLowResUrl(result.secure_url);

        return {
          url: result.secure_url,
          thumbnail,
          lowRes,
          type: isVideo ? 'video' : 'image',
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          isSensitive: !moderation.safe,
          publicId: result.public_id,
        };
      })
    );

    res.json({ urls: results });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
};

module.exports = { upload, uploadFiles };
