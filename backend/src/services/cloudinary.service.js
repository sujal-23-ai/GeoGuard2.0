const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET);

const uploadMedia = (buffer, options = {}) => {
  if (!isConfigured()) throw new Error('Cloudinary not configured');

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'geoguard/incidents',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
};

// Build optimised Cloudinary URL from an existing URL
const getOptimizedUrl = (url, { width = 400, quality = 'auto', format = 'auto', blur } = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const transforms = [`q_${quality}`, `f_${format}`, `w_${width}`];
  if (blur) transforms.push(`e_blur:${blur}`);
  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
};

// Low-res preview for progressive loading
const getLowResUrl = (url) => getOptimizedUrl(url, { width: 40, quality: 10 });

// Thumbnail: video gets a frame grab, image gets small crop
const getThumbnailUrl = (url, type = 'image') => {
  if (!url) return null;
  if (type === 'video') {
    return url
      .replace('/upload/', '/upload/q_auto,f_auto,w_400,so_2/')
      .replace(/\.[^.]+$/, '.jpg');
  }
  return getOptimizedUrl(url, { width: 200, quality: 60 });
};

// Simulated content moderation
const moderateContent = async (_url) => ({
  safe: true,
  flags: [],
  moderatedAt: new Date(),
});

module.exports = {
  uploadMedia,
  getOptimizedUrl,
  getLowResUrl,
  getThumbnailUrl,
  moderateContent,
  isConfigured,
};
