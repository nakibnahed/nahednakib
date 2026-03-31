/**
 * Path inside the `avatars` bucket from a public object URL, or null.
 */
export function avatarsBucketPathFromPublicUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url);
    const marker = "/object/public/avatars/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return null;
    return decodeURIComponent(u.pathname.slice(i + marker.length));
  } catch {
    return null;
  }
}
