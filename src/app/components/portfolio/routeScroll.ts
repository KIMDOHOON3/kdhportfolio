// The native overflow container is shared across routes, so the browser cannot
// restore its scroll position on its own.
const positions = new Map<string, number>();
const latest = new Map<string, number>();
let restoration: { pathname: string; top: number } | null = null;

export function rememberRouteScroll(url: URL, top: number) {
  positions.set(url.pathname + url.search + url.hash, top);
  latest.set(url.pathname, top);
}

export function prepareRouteScroll(url: URL, restore: boolean) {
  const top = restore
    ? (positions.get(url.pathname + url.search + url.hash) ??
      latest.get(url.pathname))
    : undefined;
  restoration = top === undefined ? null : { pathname: url.pathname, top };
}

export function restoredRouteScroll(pathname: string) {
  return restoration?.pathname === pathname ? restoration.top : null;
}

export function clearRouteScroll() {
  restoration = null;
}
