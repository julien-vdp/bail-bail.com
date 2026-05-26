import path from "path";

export function getPrivateUploadsRoot() {
  return process.env.PRIVATE_UPLOADS_DIR || path.join(process.cwd(), "private_uploads");
}
