(function () {
  const KEYS = {
    token: "campusconnectToken",
    role: "campusconnectRole",
    user: "campusconnectUser"
  };

  function safeGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSet(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {}
  }

  function safeRemove(storage, key) {
    try {
      storage.removeItem(key);
    } catch {}
  }

  function migrateLegacySession() {
    const sessionToken = safeGet(window.sessionStorage, KEYS.token);
    const legacyToken = safeGet(window.localStorage, KEYS.token);

    if (!sessionToken && legacyToken) {
      const legacyRole = safeGet(window.localStorage, KEYS.role);
      const legacyUser = safeGet(window.localStorage, KEYS.user);

      safeSet(window.sessionStorage, KEYS.token, legacyToken);
      if (legacyRole) safeSet(window.sessionStorage, KEYS.role, legacyRole);
      if (legacyUser) safeSet(window.sessionStorage, KEYS.user, legacyUser);
    }

    safeRemove(window.localStorage, KEYS.token);
    safeRemove(window.localStorage, KEYS.role);
    safeRemove(window.localStorage, KEYS.user);
  }

  function getToken() {
    return safeGet(window.sessionStorage, KEYS.token);
  }

  function getRole() {
    return safeGet(window.sessionStorage, KEYS.role);
  }

  function getUser() {
    const raw = safeGet(window.sessionStorage, KEYS.user);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setSession(session) {
    safeSet(window.sessionStorage, KEYS.token, session.token || "");
    safeSet(window.sessionStorage, KEYS.role, session.role || "");
    safeSet(window.sessionStorage, KEYS.user, JSON.stringify(session.user || null));
  }

  function updateUser(user) {
    safeSet(window.sessionStorage, KEYS.user, JSON.stringify(user || null));
  }

  function clearSession() {
    safeRemove(window.sessionStorage, KEYS.token);
    safeRemove(window.sessionStorage, KEYS.role);
    safeRemove(window.sessionStorage, KEYS.user);
    safeRemove(window.localStorage, KEYS.token);
    safeRemove(window.localStorage, KEYS.role);
    safeRemove(window.localStorage, KEYS.user);
  }

  migrateLegacySession();

  window.CampusConnectAuth = {
    getToken,
    getRole,
    getUser,
    setSession,
    updateUser,
    clearSession
  };
})();
