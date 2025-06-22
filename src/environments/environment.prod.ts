export const environment = {
  production: true,
  apiUrl: 'https://api.harmanagel.com', // Production backend URL
  oauth: {
    issuer: 'https://api.harmanagel.com',
    clientId: 'HarmanaGel_Swagger_Ui',
    redirectUri: 'https://harmanagel.com',
    postLogoutRedirectUri: 'https://harmanagel.com',
    scope: 'openid profile email phone roles HarmanaGel',
    responseType: 'code',
    requireHttps: true // Production için HTTPS zorunlu
  }
};