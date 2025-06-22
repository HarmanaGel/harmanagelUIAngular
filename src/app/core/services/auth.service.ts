import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, map, catchError, throwError } from 'rxjs';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, OAuthClaims, RegisterRequest } from '../../shared/models/user-model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private oauthService = inject(OAuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ID_TOKEN_KEY = 'id_token';
  private readonly USER_KEY = 'current_user';

  private authConfig: AuthConfig = {
    issuer: environment.oauth.issuer,
    redirectUri: environment.oauth.redirectUri,
    postLogoutRedirectUri: environment.oauth.postLogoutRedirectUri,
    clientId: environment.oauth.clientId,
    scope: environment.oauth.scope,
    responseType: environment.oauth.responseType,
    requireHttps: environment.oauth.requireHttps,
    showDebugInformation: !environment.production,

    // ABP Framework endpoint'leri
    loginUrl: `${environment.oauth.issuer}/connect/authorize`,
    tokenEndpoint: `${environment.oauth.issuer}/connect/token`,
    userinfoEndpoint: `${environment.oauth.issuer}/connect/userinfo`,
    logoutUrl: `${environment.oauth.issuer}/connect/logout`,

    // PKCE ve diğer güvenlik ayarları
    useSilentRefresh: true,
    silentRefreshTimeout: 5000,
    timeoutFactor: 0.25,
    sessionChecksEnabled: true,
    clearHashAfterLogin: false,
    nonceStateSeparator: 'semicolon'
  };

  constructor() {
    this.configureOAuth();
    this.loadUserFromStorage();
  }

  private async configureOAuth(): Promise<void> {
    this.oauthService.configure(this.authConfig);
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();

    // OAuth flow'dan gelen token varsa kullan
    if (this.oauthService.hasValidAccessToken()) {
      await this.loadUserProfileFromOAuth();
    }
  }

  // Method 1: Authorization Code Flow (Önerilen)
  async loginWithAuthorizationCode(): Promise<void> {
    this.oauthService.initCodeFlow();
  }


register(userData: RegisterRequest): Observable<any> {
  const body = new URLSearchParams();
  body.set('grant_type', 'password');
  body.set('client_id', environment.oauth.clientId);
  body.set('username', userData.email);
  body.set('password', userData.password);
  body.set('scope', environment.oauth.scope);

  // Önce kullanıcı kaydetme isteği yap (ABP'nin register endpoint'i)
  const registerData = {
    userName: userData.email,
    emailAddress: userData.email,
    password: userData.password,
    name: userData.firstName,
    surname: userData.lastName
  };

  return this.http.post<any>(`${environment.apiUrl}/api/account/register`, registerData).pipe(
    map(async (registerResponse) => {
      // Kayıt başarılıysa otomatik login yap
      const loginResponse = await this.http.post<any>(`${environment.oauth.issuer}/connect/token`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      ).toPromise();

      if (loginResponse) {
        this.storeTokens(loginResponse);
        await this.loadUserProfileFromToken();
      }

      return loginResponse;
    }),
    catchError((error) => {
      console.error('Register error:', error);
      return throwError(() => error);
    })
  );
}

  // Method 2: Password Grant (Kullanıcı adı/şifre ile direkt)
  loginWithPassword(credentials: LoginRequest): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'HarmanaGel_Swagger_Ui');
    body.set('username', credentials.email);
    body.set('password', credentials.password);
    body.set('scope', environment.oauth.scope);

    return this.http.post<any>(`${environment.oauth.issuer}/connect/token`, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }).pipe(
      map(async (tokenResponse) => {
        // Token'ları manuel olarak kaydet
        this.storeTokens(tokenResponse);

        // User profile'ı yükle
        await this.loadUserProfileFromToken();

        return tokenResponse;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  async logout(): Promise<void> {
    // Token'ları temizle
    this.clearTokens();
    this.currentUserSubject.next(null);

    // OAuth logout işlemi
    if (this.oauthService.hasValidAccessToken()) {
      await this.oauthService.revokeTokenAndLogout();
    } else {
      this.router.navigate(['/']);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    // OAuth service'den token kontrol et
    if (this.oauthService.hasValidAccessToken()) {
      return true;
    }

    // Manuel token kontrol et
    const manualToken = localStorage.getItem(this.TOKEN_KEY);
    if (manualToken) {
      // Token'ın expire olup olmadığını kontrol etmek için basit bir decode
      try {
        const tokenPayload = JSON.parse(atob(manualToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return tokenPayload.exp > currentTime;
      } catch {
        // Token decode edilemiyorsa temizle
        this.clearTokens();
        return false;
      }
    }

    return false;
  }

  getAccessToken(): string | null {
    // Önce OAuth service'den, sonra localStorage'dan token al
    return this.oauthService.getAccessToken() || localStorage.getItem(this.TOKEN_KEY);
  }

  getIdToken(): string | null {
    return this.oauthService.getIdToken() || localStorage.getItem(this.ID_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    // Önce OAuth service'den refresh token al
    const oauthRefreshToken = this.oauthService.getRefreshToken();
    if (oauthRefreshToken) {
      return oauthRefreshToken;
    }

    // Sonra localStorage'dan al
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  // OAuth flow'dan user profile yükle
  private async loadUserProfileFromOAuth(): Promise<void> {
    try {
      const userInfo = await this.oauthService.loadUserProfile() as OAuthClaims;
      const claims = this.oauthService.getIdentityClaims() as OAuthClaims;

      const user: User = {
        id: claims?.sub || '',
        email: claims?.email || userInfo?.email || '',
        firstName: claims?.given_name || userInfo?.given_name || '',
        lastName: claims?.family_name || userInfo?.family_name || '',
        role: (claims?.role as any) || 'customer',
        avatar: userInfo?.picture,
        createdAt: new Date()
      };

      this.currentUserSubject.next(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error loading user profile from OAuth:', error);
    }
  }

  // Password grant'den sonra user profile yükle
  private async loadUserProfileFromToken(): Promise<void> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) return;

      // ABP Framework userinfo endpoint'ini çağır
      const response = await fetch(`${environment.oauth.issuer}/connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();

      const user: User = {
        id: userInfo.sub || '',
        email: userInfo.email || '',
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
        lastName: userInfo.family_name || userInfo.name?.split(' ')[1] || '',
        role: userInfo.role || 'customer',
        avatar: userInfo.picture,
        createdAt: new Date()
      };

      this.currentUserSubject.next(user);

      // User'ı localStorage'a kaydet
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error loading user profile from token:', error);
    }
  }

  // Token'ları localStorage'a kaydet
  private storeTokens(tokenResponse: any): void {
    localStorage.setItem(this.TOKEN_KEY, tokenResponse.access_token);

    if (tokenResponse.refresh_token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
    }

    if (tokenResponse.id_token) {
      localStorage.setItem(this.ID_TOKEN_KEY, tokenResponse.id_token);
    }
  }

  // Token'ları temizle
  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ID_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Sayfa yenilendiğinde user'ı yükle
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    const token = this.getAccessToken();

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearTokens();
      }
    }
  }

  // Token yenileme
  async refreshToken(): Promise<boolean> {
    try {
      // Önce OAuth service'den refresh token al ve kontrol et
      const oauthRefreshToken = this.oauthService.getRefreshToken();
      if (oauthRefreshToken) {
        await this.oauthService.refreshToken();
        await this.loadUserProfileFromOAuth();
        return true;
      }

      // Manuel refresh token varsa onu kullan
      const manualRefreshToken = this.getRefreshToken();
      if (manualRefreshToken) {
        const body = new URLSearchParams();
        body.set('grant_type', 'refresh_token');
        body.set('client_id', environment.oauth.clientId);
        body.set('refresh_token', manualRefreshToken);

        const response = await this.http.post<any>(`${environment.oauth.issuer}/connect/token`,
          body.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          }
        ).toPromise();

        if (response) {
          this.storeTokens(response);
          await this.loadUserProfileFromToken();
          return true;
        }
      }

      await this.logout();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      return false;
    }
  }
}