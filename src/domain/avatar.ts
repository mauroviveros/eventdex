/**
 * Google's photo at 288 px, sharp at 144 px on a retina screen: the stored URL
 * asks for 96. Any other URL has no size to ask for and stays as it is.
 */
export const largeAvatar = (url: string) =>
  url.replace(/=s\d+(-c)?$/, "=s288-c");
