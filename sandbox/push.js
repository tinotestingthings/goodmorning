(function (global) {
  "use strict";

  // Web Push subscription helper. The app is a static site with no backend,
  // so the "push server" is Tinus's daily scheduled task on his Mac: it holds
  // the VAPID PRIVATE key and sends a push (via pywebpush) to the subscription
  // below whenever new cards land in 00 Inbox. Only the PUBLIC key lives here.
  var VAPID_PUBLIC =
    "BIkbKhI7wXzQFtCh4nWg5RsMNI2wQ6ZA_8kCeqTn1yxWWg1YGsX-c3dGoBONT1Zcf--pzwImN4_WuENjH4xjR24";

  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var raw = global.atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function supported() {
    return ("serviceWorker" in navigator) &&
           ("PushManager" in global) &&
           ("Notification" in global);
  }

  function ready() { return navigator.serviceWorker.ready; }

  function getSubscription(cb) {
    if (!supported()) { cb(null); return; }
    ready()
      .then(function (reg) { return reg.pushManager.getSubscription(); })
      .then(function (sub) { cb(sub); })
      .catch(function () { cb(null); });
  }

  function subscribe(cb) {
    if (!supported()) { cb({ error: "unsupported" }); return; }
    Notification.requestPermission().then(function (perm) {
      if (perm !== "granted") { cb({ error: "denied" }); return; }
      ready().then(function (reg) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
        });
      }).then(function (sub) {
        cb({ subscription: sub });
      }).catch(function (e) {
        cb({ error: (e && e.message) || "failed" });
      });
    });
  }

  function unsubscribe(cb) {
    getSubscription(function (sub) {
      if (!sub) { cb(true); return; }
      sub.unsubscribe().then(function () { cb(true); }).catch(function () { cb(false); });
    });
  }

  global.Push = {
    supported: supported,
    getSubscription: getSubscription,
    subscribe: subscribe,
    unsubscribe: unsubscribe
  };
})(window);
