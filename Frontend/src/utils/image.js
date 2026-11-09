// Cloudinary resizes and compresses photos on the fly when the link asks for it.
// "https://res.cloudinary.com/demo/image/upload/v1/x.jpg"
//   → "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_600/v1/x.jpg"
// Local links (/images/...) are returned unchanged.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!f_auto)/;

export function getImageUrl(url, width) {
  if (!url) return url;
  return url.replace(CLOUDINARY_UPLOAD, `$1f_auto,q_auto,c_limit,w_${width}/`);
}
