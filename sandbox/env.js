// Single source of truth for which data namespace this build reads.
// The live app (served from the repo root) uses the "dd." key prefix; the
// sandbox (served under /sandbox/) uses "sbx.". This is decided at RUNTIME
// from the URL path — never baked into the source — so the exact same code
// is correct at both URLs, and copying sandbox files onto live can no longer
// point the live app at sandbox data. All storage keys go through k("name").
// Background: 40 Projects/2026-08-04-sandbox-live-promotion-safety-spec.
(function (g) {
  var isSandbox = !!(g.location && g.location.pathname.indexOf("/sandbox/") !== -1);
  g.DD_ENV = {
    sandbox: isSandbox,
    ns: isSandbox ? "sbx." : "dd.",
    // version: stamped by tools/stamp-sandbox-version.sh (pre-commit) for the
    // sandbox and by tools/promote.sh for live; shown in the badge + Settings.
    titlePrefix: isSandbox ? "SBX · " : "", version: "sbx 2026-09-04 18:34"
  };
  g.k = function (name) { return g.DD_ENV.ns + name; };
  try { if (g.document) g.document.title = g.DD_ENV.titlePrefix + "Daily Digest"; } catch (e) {}
})(typeof window !== "undefined" ? window : this);
