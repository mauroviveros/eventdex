/**
 * Google's photo at 36 px, so that scaled 4× it shows real pixels at 144 px.
 * Any other URL has no size to ask for and stays as it is.
 */
export const pixelAvatar = (url: string) =>
  url.replace(/=s\d+(-c)?$/, "=s36-c");
