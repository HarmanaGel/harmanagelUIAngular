export const environment = {
  production: false,
  apiUrl: 'https://localhost:44315', // ABP backend URL'iniz
  oauth: {
    issuer: 'https://localhost:44315',
    clientId: 'HarmanaGel_App',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scope: 'openid profile email phone roles HarmanaGel',
    responseType: 'code',
    requireHttps: false, // Development için
    secret: 'SuperGizliClientSecret123!'
  }
};