// CRA dev-server proxy — runs in Node.js, so @azure/msal-node works here
// and there are no browser CORS restrictions.
// Exposes POST /api/az-token → returns { access_token } to the React app.

const { PublicClientApplication } = require('@azure/msal-node');

// In-memory token cache shared across requests
let _tokenCache = null; // { accessToken, expiresAt }

async function getAzureToken() {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt - now > 5 * 60 * 1000) {
    console.log('[Proxy] Using cached Azure token');
    return _tokenCache.accessToken;
  }

  const authority = process.env.REACT_APP_AZ_NEO4J_AUTHORITY;
  const clientId  = process.env.REACT_APP_AZ_CLIENT_ID;
  const username  = process.env.REACT_APP_AZ_NEO4J_USERNAME;
  const password  = process.env.REACT_APP_AZ_NEO4J_PASSWORD;
  const scopes    = [`api://${clientId}/access-token`];

  const pca = new PublicClientApplication({
    auth: { clientId, authority },
  });

  // Try silent first (uses cached accounts from previous calls)
  const accounts = await pca.getTokenCache().getAllAccounts();
  if (accounts.length > 0) {
    try {
      const silent = await pca.acquireTokenSilent({ scopes, account: accounts[0] });
      if (silent?.accessToken) {
        console.log('[Proxy] Token acquired silently');
        const expiresAt = silent.expiresOn ? silent.expiresOn.getTime() : now + 3600000;
        _tokenCache = { accessToken: silent.accessToken, expiresAt };
        return silent.accessToken;
      }
    } catch (_) {}
  }

  // Fallback to username/password (ROPC) — same as your working script
  const result = await pca.acquireTokenByUsernamePassword({ scopes, username, password });
  if (!result?.accessToken) throw new Error('Failed to acquire Azure token');

  console.log('[Proxy] Token acquired via username/password');
  const expiresAt = result.expiresOn ? result.expiresOn.getTime() : now + 3600000;
  _tokenCache = { accessToken: result.accessToken, expiresAt };
  return result.accessToken;
}

module.exports = function (app) {
  app.post('/api/az-token', async (req, res) => {
    try {
      const accessToken = await getAzureToken();
      res.json({ access_token: accessToken });
    } catch (err) {
      console.error('[Proxy] Azure token error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
};

