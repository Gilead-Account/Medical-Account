// Detect the app's runtime mode separately from its width-based layout.
// For example, a desktop web page can use a tablet layout without being an iPad.
// App.jsx uses the runtime mode to decide whether to show the plan launcher.
export const MOBILE_VIEW_MAX_WIDTH = 720;
export const IPAD_VIEW_MAX_WIDTH = 1400;

// Use an explicitly supplied window-like object (useful in tests), otherwise
// use the browser window. Return null when running outside a browser.
const getWindowLike = (env) => env || (typeof window !== 'undefined' ? window : null);

// Safely check a browser media query, such as whether the pointer is coarse
// (typically touch) or fine (typically a mouse). Unsupported/failed checks
// return false so detection can continue using the other signals.
const mediaMatches = (win, query) => {
  if (!win || typeof win.matchMedia !== 'function') return false;
  try {
    return Boolean(win.matchMedia(query).matches);
  } catch {
    return false;
  }
};

// Normalize a viewport measurement to a positive, rounded number of pixels.
// Missing, invalid, zero, or negative measurements become 0 (unknown).
const viewportNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
};

// Look for an explicit iPad identity, or the Mac-style platform plus multiple
// touch points that iPadOS can report. This is a device heuristic, not a
// screen-width check; a narrow desktop browser does not satisfy it alone.
const isLikelyIPad = ({ userAgent, platform, maxTouchPoints }) => {
  const ua = String(userAgent || '');
  const devicePlatform = String(platform || '');
  if (/iPad/i.test(ua) || /iPad/i.test(devicePlatform)) return true;

  // iPadOS can present a desktop Safari/Mac platform in embedded web views.
  return /MacIntel|Macintosh|MacPPC|Mac68K/i.test(devicePlatform) && maxTouchPoints > 1;
};

// Choose the responsive layout from width alone: up to 720px is mobile,
// 721–1400px is tablet, and above 1400px is desktop. A missing width is unknown.
const layoutModeForWidth = (width) => {
  if (!width) return 'unknown';
  if (width <= MOBILE_VIEW_MAX_WIDTH) return 'mobile';
  if (width <= IPAD_VIEW_MAX_WIDTH) return 'tablet';
  return 'desktop';
};

// Recognize an HTTP(S) page, including localhost. Other protocols can indicate
// a locally packaged Veeva container; this check does not test connectivity.
const isHostedWebLocation = (location) => {
  const protocol = String(location?.protocol || '').toLowerCase();
  return protocol === 'http:' || protocol === 'https:';
};

// Collect browser/device signals and return one snapshot for App and diagnostics.
// Runtime mode follows this priority:
//   1. Likely iPad device -> ipad, regardless of width or hosting protocol.
//   2. Otherwise, mobile-width layout -> mobile.
//   3. Otherwise, tablet layout on a non-HTTP(S) page -> ipad.
//   4. Otherwise -> desktop, including HTTP(S) pages at tablet widths.
// layoutMode remains a separate width-only result. Pointer/touch measurements
// are included for diagnostics; touch capability alone does not select iPad.
// This function only reads signals: App owns resize/orientation listeners.
export const detectRuntimeViewMode = (env) => {
  const win = getWindowLike(env);
  const nav = win?.navigator || {};
  const location = win?.location || {};
  const width = viewportNumber(win?.innerWidth);
  const height = viewportNumber(win?.innerHeight);
  const userAgent = nav.userAgent || '';
  const platform = nav.platform || '';
  const maxTouchPoints = Number(nav.maxTouchPoints) || 0;
  const coarsePointer = mediaMatches(win, '(pointer: coarse)');
  const finePointer = mediaMatches(win, '(hover: hover) and (pointer: fine)');
  const isTouchCapable = maxTouchPoints > 0 || coarsePointer;
  const isLikelyIPadDevice = isLikelyIPad({ userAgent, platform, maxTouchPoints });
  const layoutMode = layoutModeForWidth(width);
  const isTabletLayout = layoutMode === 'tablet';
  const isHostedWebLink = isHostedWebLocation(location);
  const viewMode = isLikelyIPadDevice
    ? 'ipad'
    : layoutMode === 'mobile'
      ? 'mobile'
      : !isHostedWebLink && isTabletLayout
        ? 'ipad'
        : 'desktop';
  const reason = isLikelyIPadDevice
    ? 'iPad device signal'
    : (isHostedWebLink && isTabletLayout ? 'hosted web link' : (isTabletLayout ? 'tablet breakpoint' : `${layoutMode} breakpoint`));

  return {
    viewMode,
    layoutMode,
    reason,
    width,
    height,
    isLikelyIPadDevice,
    isTouchCapable,
    hasFinePointer: finePointer,
    coarsePointer,
    isHostedWebLink,
    protocol: location.protocol || '',
    hostname: location.hostname || '',
    userAgent,
    platform,
    maxTouchPoints,
  };
};

// Convert an internal runtime-mode value into a readable label for diagnostics.
// Unrecognized or missing values display as Unknown.
const viewModeLabel = (value) => {
  if (value === 'ipad') return 'iPad';
  if (value === 'mobile') return 'Mobile';
  if (value === 'desktop') return 'Desktop';
  return 'Unknown';
};

// Turn a detection snapshot into a readable support/debug string containing
// the chosen mode/reason, viewport, touch support, pointer, and iPad signal.
// It formats an existing snapshot rather than detecting the device again.
export const runtimeViewModeSummary = (snapshot) => {
  const mode = viewModeLabel(snapshot?.viewMode);
  const width = snapshot?.width || 0;
  const height = snapshot?.height || 0;
  const touch = snapshot?.isTouchCapable ? 'yes' : 'no';
  const pointer = snapshot?.hasFinePointer ? 'fine' : (snapshot?.coarsePointer ? 'coarse' : 'unknown');
  const device = snapshot?.isLikelyIPadDevice ? 'likely iPad' : 'not iPad';
  const reason = snapshot?.reason || 'unknown';

  return `Detected ${mode} view (${reason}) | viewport: ${width}x${height} | touch: ${touch} | pointer: ${pointer} | device: ${device}`;
};
