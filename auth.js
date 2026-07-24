(function () {
  "use strict";

  // Real auth gate via Supabase Auth (replaces the old hardcoded 1234 PIN).
  // The app shell is public, but nothing meaningful renders until there's a
  // valid session, and the actual data lives behind Supabase + Row-Level
  // Security — so this is genuine access control, not a cosmetic lock.

  var overlay = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function removeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function setMsg(node, text, isError) {
    node.textContent = text || "";
    node.classList.toggle("auth-msg-error", !!isError);
  }

  function mountLogin(reason) {
    if (overlay) return;
    overlay = el("div", "auth-overlay");
    var box = el("div", "auth-box");

    box.appendChild(el("div", "auth-title", "Daily Digest"));
    box.appendChild(el("div", "auth-sub", "Sign in to continue"));

    // Offline / library-missing: fail closed, offer reload, no form.
    if (!window.SB) {
      box.appendChild(el("p", "auth-msg auth-msg-error",
        "Can't reach the login service. Check your connection and reload."));
      var reload = el("button", "btn btn-primary", "Reload");
      reload.type = "button";
      reload.addEventListener("click", function () { window.location.reload(); });
      box.appendChild(reload);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      return;
    }

    var email = document.createElement("input");
    email.type = "email";
    email.className = "auth-input";
    email.placeholder = "email";
    email.autocomplete = "email";

    var pass = document.createElement("input");
    pass.type = "password";
    pass.className = "auth-input";
    pass.placeholder = "password";
    pass.autocomplete = "current-password";

    var msg = el("p", "auth-msg");

    var loginBtn = el("button", "btn btn-primary auth-primary", "Log in");
    loginBtn.type = "button";

    var signupBtn = el("button", "auth-link", "New here? Create an account");
    signupBtn.type = "button";

    var mode = "login"; // or "signup"

    function busy(on, label) {
      loginBtn.disabled = on;
      email.disabled = on;
      pass.disabled = on;
      loginBtn.textContent = on ? (label || "…") : (mode === "login" ? "Log in" : "Sign up");
    }

    function submit() {
      var e = (email.value || "").trim();
      var p = pass.value || "";
      if (!e || !p) { setMsg(msg, "Enter your email and password.", true); return; }
      setMsg(msg, "");
      busy(true, mode === "login" ? "Logging in…" : "Creating…");

      var op = mode === "login"
        ? window.SB.auth.signInWithPassword({ email: e, password: p })
        : window.SB.auth.signUp({ email: e, password: p });

      op.then(function (res) {
        busy(false);
        if (res.error) { setMsg(msg, res.error.message, true); return; }
        if (mode === "signup" && res.data && !res.data.session) {
          // Email confirmation is on — no session yet.
          setMsg(msg, "Account made. Check your email to confirm, then log in.", false);
          mode = "login";
          signupBtn.textContent = "New here? Create an account";
          loginBtn.textContent = "Log in";
          return;
        }
        // success: onAuthStateChange will remove the overlay.
      }, function (err) {
        busy(false);
        setMsg(msg, (err && err.message) || "Something went wrong.", true);
      });
    }

    loginBtn.addEventListener("click", submit);
    pass.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(); });
    signupBtn.addEventListener("click", function () {
      mode = (mode === "login") ? "signup" : "login";
      loginBtn.textContent = (mode === "login") ? "Log in" : "Sign up";
      signupBtn.textContent = (mode === "login")
        ? "New here? Create an account"
        : "Have an account? Log in";
      setMsg(msg, "");
    });

    box.appendChild(email);
    box.appendChild(pass);
    box.appendChild(loginBtn);
    box.appendChild(msg);
    box.appendChild(signupBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    if (reason === "signedout") setMsg(msg, "Signed out.", false);
    setTimeout(function () { email.focus(); }, 50);
  }

  function boot() {
    if (!window.SB) { mountLogin(); return; }
    window.SB.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (!session) mountLogin();
      else removeOverlay();
    }).catch(function () { mountLogin(); });

    window.SB.auth.onAuthStateChange(function (event, session) {
      if (session) removeOverlay();
      else mountLogin(event === "SIGNED_OUT" ? "signedout" : undefined);
    });
  }

  // Expose a sign-out for a future Settings button.
  window.Auth = {
    signOut: function () { if (window.SB) window.SB.auth.signOut(); }
  };

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
