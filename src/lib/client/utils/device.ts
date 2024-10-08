/**
 * Returns true if the device is thought to be a mobile or tablet
 * @returns {boolean}
 */
export function isMobileOrTablet() {
  return /(android|iphone|ipad|mobile)/i.test(navigator.userAgent)
}
