import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuctionBidDto, AuctionDto } from '../../shared/models/auction.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuctionHubService {
  private hubConnection: HubConnection | null = null;
  private connectionState = new BehaviorSubject<string>('Disconnected');

  // Events
  private bidPlaced = new BehaviorSubject<AuctionBidDto | null>(null);
  private auctionUpdated = new BehaviorSubject<AuctionDto | null>(null);
  private timeExtended = new BehaviorSubject<{auctionId: string, newEndTime: Date} | null>(null);
  private auctionEnded = new BehaviorSubject<{auctionId: string, winningBid?: AuctionBidDto} | null>(null);

  constructor(private authService: AuthService) {}

  public startConnection(): Promise<void> {
    if (this.hubConnection) {
      return Promise.resolve();
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/signalr/auction-hub`, {
        accessTokenFactory: () => {
          const token = this.authService.getAccessToken();
          return token || '';
        }
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventListeners();

    return this.hubConnection.start()
      .then(() => {
        console.log('SignalR connection started');
        this.connectionState.next('Connected');
      })
      .catch((err: any) => {
        console.error('Error while starting SignalR connection: ' + err);
        this.connectionState.next('Error');
        throw err;
      });
  }

  public stopConnection(): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.stop().then(() => {
        this.hubConnection = null;
        this.connectionState.next('Disconnected');
      });
    }
    return Promise.resolve();
  }

  public joinAuctionGroup(auctionId: string): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.invoke('JoinAuctionGroup', auctionId);
    }
    return Promise.reject('No connection established');
  }

  public leaveAuctionGroup(auctionId: string): Promise<void> {
    if (this.hubConnection) {
      return this.hubConnection.invoke('LeaveAuctionGroup', auctionId);
    }
    return Promise.reject('No connection established');
  }

  private setupEventListeners(): void {
    if (!this.hubConnection) return;

    // Yeni teklif geldiğinde
    this.hubConnection.on('BidPlaced', (bid: AuctionBidDto) => {
      this.bidPlaced.next(bid);
    });

    // Açık arttırma güncellendiğinde
    this.hubConnection.on('AuctionUpdated', (auction: AuctionDto) => {
      this.auctionUpdated.next(auction);
    });

    // Süre uzatıldığında
    this.hubConnection.on('TimeExtended', (auctionId: string, newEndTime: string) => {
      this.timeExtended.next({
        auctionId,
        newEndTime: new Date(newEndTime)
      });
    });

    // Açık arttırma bittiğinde
    this.hubConnection.on('AuctionEnded', (auctionId: string, winningBid?: AuctionBidDto) => {
      this.auctionEnded.next({
        auctionId,
        winningBid
      });
    });

    // Bağlantı durumu değişiklikleri
    this.hubConnection.onreconnecting(() => {
      this.connectionState.next('Reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState.next('Connected');
    });

    this.hubConnection.onclose(() => {
      this.connectionState.next('Disconnected');
    });
  }

  // Observables
  public get connectionState$(): Observable<string> {
    return this.connectionState.asObservable();
  }

  public get bidPlaced$(): Observable<AuctionBidDto | null> {
    return this.bidPlaced.asObservable();
  }

  public get auctionUpdated$(): Observable<AuctionDto | null> {
    return this.auctionUpdated.asObservable();
  }

  public get timeExtended$(): Observable<{auctionId: string, newEndTime: Date} | null> {
    return this.timeExtended.asObservable();
  }

  public get auctionEnded$(): Observable<{auctionId: string, winningBid?: AuctionBidDto} | null> {
    return this.auctionEnded.asObservable();
  }

  public get isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }
}
