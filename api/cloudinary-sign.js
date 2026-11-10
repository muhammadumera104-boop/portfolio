// POST /api/cloudinary-sign — returns a signed upload for one image. Admin only.
// The Cloudinary API secret stays here; the browser uploads straight to Cloudinary with the signature.
import { handle, jsonBody } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import { createUploadSignature } from './_lib/cloudinary.js';

export default handle(async (req) => {
  await requireAdmin(req);
  const { folder } = jsonBody(req);
  return createUploadSignature({ folder: typeof folder === 'string' && folder ? folder : undefined });
});
