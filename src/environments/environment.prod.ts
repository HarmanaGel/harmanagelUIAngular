export const environment = {
  production: true,
  apiUrl: 'https://api.harmanagel.com', // ABP backend URL'iniz
  oauth: {
    issuer: 'https://api.harmanagel.com',
    clientId: 'HarmanaGel_Swagger_Ui',
    redirectUri: 'https://harmanagel.com',
    postLogoutRedirectUri: 'https://harmanagel.com',
    scope: 'openid profile email phone roles HarmanaGel',
    responseType: 'code',
    requireHttps: true // Development için
  }
};