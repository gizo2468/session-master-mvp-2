
/**
 * Utility function to detect the platform (web, iOS, Android)
 * @returns "ios", "android", or "web"
 */
export function detectPlatform(): "ios" | "android" | "web" {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  } else if (/android/.test(userAgent)) {
    return "android";
  } else {
    return "web";
  }
}
