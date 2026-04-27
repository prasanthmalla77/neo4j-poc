// CRA dev-server proxy — runs in Node, so no CORS restrictions.
// Forwards /api/az-token → https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token
// This avoids the browser CORS block on the Azure AD token endpoint.

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // authority = https://login.microsoftonline.com/<tenantId>
  const authority  = process.env.REACT_APP_AZ_NEO4J_AUTHORITY || '';
  const tenantPath = authority.replace('https://login.microsoftonline.com', '') || '';

  app.use(
    '/api/az-token',
    createProxyMiddleware({
      target:      'https://login.microsoftonline.com',
      changeOrigin: true,
      pathRewrite:  { '^/api/az-token': `${tenantPath}/oauth2/v2.0/token` },
      secure:       true,
    })
  );
};
