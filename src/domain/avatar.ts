/**
 * Google's photo at 288 px, sharp at 144 px on a retina screen: the stored URL
 * asks for 96. Any other URL has no size to ask for and stays as it is.
 */
export const largeAvatar = (url: string) =>
  url.replace(/=s\d+(-c)?$/, "=s288-c");

/**
 * Whether the server may download this photo. A visitor can edit their own
 * avatar_url, so anything else could make the server fetch an internal address.
 */
export function isGooglePhoto(url: string) {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" && /^lh\d\.googleusercontent\.com$/.test(hostname)
    );
  } catch {
    return false;
  }
}
