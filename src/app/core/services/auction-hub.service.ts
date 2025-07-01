import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuctionBidDto, AuctionDto, AuctionDetailDto } from '../../shared/models/auction.model';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuctionHubService {
  private hubConnection: HubConnection | null = null;
  private connectionState = new BehaviorSubject<string>('Disconnected');

  // Real-time Events (Backend'deki event'lerle tam eşleşen)
  private newBid = new BehaviorSubject<any>(null);
  private auctionUpdated = new BehaviorSubject<AuctionDetailDto | null>(null);
  private timeExtended = new BehaviorSubject<any>(null);
  private auctionStarted = new BehaviorSubject<any>(null);
  private auctionEnded = new BehaviorSubject<any>(null);
  private auctionApproved = new BehaviorSubject<any>(null);
  private auctionCancelled = new BehaviorSubject<any>(null);
  private auctionPaused = new BehaviorSubject<any>(null);
  private auctionError = new BehaviorSubject<any>(null);
  private timerUpdate = new BehaviorSubject<any>(null);
  private userJoined = new BehaviorSubject<any>(null);
  private userLeft = new BehaviorSubject<any>(null);
  private auctionStatusChanged = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService
  ) {}

  /**
   * SignalR bağlantısını başlatır
   */
  public async startConnection(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      return Promise.resolve();
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/signalr/auction-hub`, {
        accessTokenFactory: () => {
          const token = this.authService.getAccessToken();
          console.log('🔐 SignalR Token:', token ? 'Token var' : 'Token yok');
          return token || '';
        }
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventListeners();
    this.setupConnectionEvents();

    try {
      console.log('🔄 SignalR bağlantısı başlatılıyor...', `${environment.apiUrl}/signalr/auction-hub`);
      await this.hubConnection.start();
      console.log('🚀 SignalR bağlantısı BAŞARILI!');
      this.connectionState.next('Connected');
    } catch (err: any) {
      console.error('❌ SignalR bağlantı hatası:', err);
      console.error('❌ Detaylı hata:', err.message, err.statusCode);
      this.connectionState.next('Error');
      throw err;
    }
  }

  /**
   * SignalR bağlantısını durdurur
   */
  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.connectionState.next('Disconnected');
      console.log('🔌 SignalR bağlantısı kesildi');
    }
  }

  /**
   * Açık arttırma grubuna katılır
   */
  public async joinAuction(auctionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('JoinAuction', auctionId);
        console.log(`✅ Açık arttırmaya katılındı: ${auctionId}`);
      } catch (error) {
        console.error(`❌ Açık arttırmaya katılım hatası: ${auctionId}`, error);
      }
    }
  }

  /**
   * Açık arttırma grubundan ayrılır
   */
  public async leaveAuction(auctionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('LeaveAuction', auctionId);
        console.log(`👋 Açık arttırmadan ayrılındı: ${auctionId}`);
      } catch (error) {
        console.error(`❌ Açık arttırmadan ayrılma hatası: ${auctionId}`, error);
      }
    }
  }

  /**
   * Backend'den gelen tüm event'leri dinler
   */
  private setupEventListeners(): void {
    if (!this.hubConnection) return;

         // Yeni bid geldiğinde
     this.hubConnection.on('NewBid', (bidData: any) => {
       console.log('💰 Yeni bid:', bidData);
       this.newBid.next(bidData);
     });

    // Açık arttırma güncellendiğinde
    this.hubConnection.on('AuctionUpdated', (auction: AuctionDetailDto) => {
      console.log('🔄 Açık arttırma güncellendi:', auction);
      this.auctionUpdated.next(auction);
    });

         // Süre uzatıldığında
     this.hubConnection.on('TimeExtended', (data: any) => {
       console.log('⏰ Süre uzatıldı:', data);
       this.timeExtended.next(data);
     });

     // Açık arttırma başladığında
     this.hubConnection.on('AuctionStarted', (data: any) => {
       console.log('🎯 Açık arttırma başladı:', data);
       this.auctionStarted.next(data);
     });

     // Açık arttırma bittiğinde
     this.hubConnection.on('AuctionEnded', (data: any) => {
       console.log('🏁 Açık arttırma bitti:', data);
       this.auctionEnded.next(data);
     });

     // Açık arttırma onaylandığında
     this.hubConnection.on('AuctionApproved', (data: any) => {
       console.log('✅ Açık arttırma onaylandı:', data);
       this.auctionApproved.next(data);
     });

     // Açık arttırma iptal edildiğinde
     this.hubConnection.on('AuctionCancelled', (data: any) => {
       console.log('❌ Açık arttırma iptal edildi:', data);
       this.auctionCancelled.next(data);
     });

     // Açık arttırma duraklatıldığında
     this.hubConnection.on('AuctionPaused', (data: any) => {
       console.log('⏸️ Açık arttırma duraklatıldı:', data);
       this.auctionPaused.next(data);
     });

     // Hata oluştuğunda
     this.hubConnection.on('AuctionError', (data: any) => {
       console.error('🚨 Açık arttırma hatası:', data);
       this.auctionError.next(data);
     });

    // Timer güncellemesi
    this.hubConnection.on('TimerUpdate', (data: any) => {
      this.timerUpdate.next(data);
    });

    // Kullanıcı katıldığında
    this.hubConnection.on('UserJoined', (data: any) => {
      console.log('👤 Kullanıcı katıldı:', data);
      this.userJoined.next(data);
    });

    // Kullanıcı ayrıldığında
    this.hubConnection.on('UserLeft', (data: any) => {
      console.log('🚪 Kullanıcı ayrıldı:', data);
      this.userLeft.next(data);
    });

    // Genel açık arttırma durum değişiklikleri
    this.hubConnection.on('AuctionStatusChanged', (data: any) => {
      console.log('📊 Açık arttırma durumu değişti:', data);
      this.auctionStatusChanged.next(data);
    });

    // Hub-specific events
    this.hubConnection.on('JoinedAuction', (auctionId: string) => {
      console.log(`✅ Başarıyla katılındı: ${auctionId}`);
    });

    this.hubConnection.on('LeftAuction', (auctionId: string) => {
      console.log(`👋 Başarıyla ayrılındı: ${auctionId}`);
    });

         this.hubConnection.on('Error', (message: string) => {
       console.error('❌ Hub hatası:', message);
     });
  }

  /**
   * Bağlantı durumu event'lerini ayarlar
   */
  private setupConnectionEvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error) => {
      console.log('🔄 SignalR yeniden bağlanıyor...', error);
      this.connectionState.next('Reconnecting');
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('🔗 SignalR yeniden bağlandı, Connection ID:', connectionId);
      this.connectionState.next('Connected');
    });

    this.hubConnection.onclose((error) => {
      console.log('🔌 SignalR bağlantısı kapandı:', error);
      this.connectionState.next('Disconnected');
    });
  }

  // Observables - UI componentlerinin dinleyebileceği
  public get connectionState$(): Observable<string> {
    return this.connectionState.asObservable();
  }

  public get newBid$(): Observable<any> {
    return this.newBid.asObservable();
  }

  public get auctionUpdated$(): Observable<AuctionDetailDto | null> {
    return this.auctionUpdated.asObservable();
  }

  public get timeExtended$(): Observable<any> {
    return this.timeExtended.asObservable();
  }

  public get auctionStarted$(): Observable<any> {
    return this.auctionStarted.asObservable();
  }

  public get auctionEnded$(): Observable<any> {
    return this.auctionEnded.asObservable();
  }

  public get auctionApproved$(): Observable<any> {
    return this.auctionApproved.asObservable();
  }

  public get auctionCancelled$(): Observable<any> {
    return this.auctionCancelled.asObservable();
  }

  public get auctionPaused$(): Observable<any> {
    return this.auctionPaused.asObservable();
  }

  public get auctionError$(): Observable<any> {
    return this.auctionError.asObservable();
  }

  public get timerUpdate$(): Observable<any> {
    return this.timerUpdate.asObservable();
  }

  public get userJoined$(): Observable<any> {
    return this.userJoined.asObservable();
  }

  public get userLeft$(): Observable<any> {
    return this.userLeft.asObservable();
  }

  public get auctionStatusChanged$(): Observable<any> {
    return this.auctionStatusChanged.asObservable();
  }

  // Utility methods
  public get isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  public get connectionStatus(): string {
    return this.connectionState.value;
  }
}
