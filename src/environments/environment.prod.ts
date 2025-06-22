export const environment = {
  production: true,
  apiUrl: 'https://api.harmanagel.com', // Production backend URL'iniz
  oauth: {
    issuer: 'https://api.harmanagel.com', // Production issuer URL
    clientId: 'HarmanaGel_Swagger_Ui',
    redirectUri: 'https://harmanagel.com', // Production frontend URL
    postLogoutRedirectUri: 'https://harmanagel.com',
    scope: 'openid profile email phone roles HarmanaGel',
    responseType: 'code',
    requireHttps: true // Production için HTTPS zorunlu
  }
};