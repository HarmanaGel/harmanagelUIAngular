import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';

import { AuctionService } from '../../core/services/auction.service';
import { AuctionHubService } from '../../core/services/auction-hub.service';
import {
  AuctionDetailDto,
  AuctionBidDto,
  PlaceBidDto,
  AuctionStatus,
  AuctionProductType,
  AuctionDto
} from '../../shared/models/auction.model';

@Component({
  selector: 'app-auction-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auction-detail.component.html'
})
export class AuctionDetailComponent implements OnInit, OnDestroy {
  @Input() id!: string;

  private destroy$ = new Subject<void>();
  private timer$ = new Subject<void>();

  auctionDetail: AuctionDetailDto | null = null;
  loading = true;
  bidAmount = 0;
  bidNotes = '';
  placingBid = false;
  bidError = '';
  timeRemaining = '';
  connectionStatus = 'Disconnected';

  // Enums for template
  AuctionStatus = AuctionStatus;
  AuctionProductType = AuctionProductType;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private auctionService: AuctionService,
    private hubService: AuctionHubService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) {
      this.router.navigate(['/auction']);
      return;
    }

    this.initializeSignalR();
    this.loadAuctionDetail();
    this.setupHubEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timer$.next();
    this.timer$.complete();
    this.hubService.leaveAuctionGroup(this.id);
  }

  private async initializeSignalR(): Promise<void> {
    try {
      await this.hubService.startConnection();
      await this.hubService.joinAuctionGroup(this.id);

      this.hubService.connectionState$
        .pipe(takeUntil(this.destroy$))
        .subscribe(status => {
          this.connectionStatus = status;
        });
    } catch (error) {
      console.error('SignalR connection failed:', error);
    }
  }

  private setupHubEvents(): void {
    // Yeni teklif geldiğinde
    this.hubService.bidPlaced$
      .pipe(takeUntil(this.destroy$))
      .subscribe(bid => {
        if (bid && bid.auctionId === this.id && this.auctionDetail) {
          this.auctionDetail.recentBids.unshift(bid);
          this.auctionDetail.currentPrice = bid.bidAmount;
          this.auctionDetail.totalBids++;
          this.bidAmount = bid.bidAmount + this.auctionDetail.minimumBidIncrement;
        }
      });

    // Açık arttırma güncellendiğinde
    this.hubService.auctionUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(auction => {
        if (auction && auction.id === this.id && this.auctionDetail) {
          // Update relevant fields
          this.auctionDetail.currentPrice = auction.currentPrice;
          this.auctionDetail.totalBids = auction.totalBids;
          this.auctionDetail.status = auction.status;
        }
      });

    // Süre uzatıldığında
    this.hubService.timeExtended$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event && event.auctionId === this.id && this.auctionDetail) {
          this.auctionDetail.endTime = event.newEndTime;
        }
      });

    // Açık arttırma bittiğinde
    this.hubService.auctionEnded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event && event.auctionId === this.id && this.auctionDetail) {
          this.auctionDetail.status = AuctionStatus.Completed;
          if (event.winningBid) {
            this.auctionDetail.winningBidId = event.winningBid.id;
          }
        }
      });
  }

  private loadAuctionDetail(): void {
    this.loading = true;
    this.auctionService.getDetail(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          this.auctionDetail = detail;
          this.bidAmount = detail.currentPrice + detail.minimumBidIncrement;
          this.loading = false;
          // Açık arttırma detayı yüklendikten sonra timer'ı başlat
          this.startTimer();
        },
        error: (error) => {
          console.error('Açık arttırma detayı yüklenirken hata:', error);
          this.loading = false;
          this.router.navigate(['/auction']);
        }
      });
  }

  private startTimer(): void {
    interval(1000)
      .pipe(takeUntil(this.timer$), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTimeRemaining();
      });
  }

  private updateTimeRemaining(): void {
    if (!this.auctionDetail) return;

    const now = new Date();
    const end = new Date(this.auctionDetail.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      this.timeRemaining = 'Bitti';
      this.timer$.next();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      this.timeRemaining = `${days}g ${hours}s ${minutes}d ${seconds}sn`;
    } else if (hours > 0) {
      this.timeRemaining = `${hours}s ${minutes}d ${seconds}sn`;
    } else if (minutes > 0) {
      this.timeRemaining = `${minutes}d ${seconds}sn`;
    } else {
      this.timeRemaining = `${seconds}sn`;
    }
  }

  getNextMinimumBid(): number {
    if (!this.auctionDetail) return 0;
    return this.auctionDetail.currentPrice + this.auctionDetail.minimumBidIncrement;
  }

  onBidAmountChange(): void {
    this.bidError = '';
    const nextMinBid = this.getNextMinimumBid();
    if (this.auctionDetail && this.bidAmount < nextMinBid) {
      this.bidError = `Minimum teklif miktarı ${this.formatPrice(nextMinBid)} olmalıdır.`;
    }
  }

  placeBid(): void {
    if (!this.auctionDetail || this.placingBid) return;

    const nextMinBid = this.getNextMinimumBid();
    if (this.bidAmount < nextMinBid) {
      this.bidError = `Minimum teklif miktarı ${this.formatPrice(nextMinBid)} olmalıdır.`;
      return;
    }

    this.placingBid = true;
    this.bidError = '';

    const placeBidDto: PlaceBidDto = {
      auctionId: this.id,
      bidAmount: this.bidAmount,
      notes: this.bidNotes?.trim() || undefined
    };

    this.auctionService.placeBid(placeBidDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bid) => {
          // SignalR üzerinden güncelleme gelecek
          this.placingBid = false;
          // Başarılı teklif sonrası not alanını temizle
          this.bidNotes = '';
        },
        error: (error) => {
          console.error('Teklif verilirken hata:', error);
          this.bidError = error.error?.message || 'Teklif verilemedi. Lütfen tekrar deneyin.';
          this.placingBid = false;
        }
      });
  }

  setQuickBid(increment: number): void {
    if (this.auctionDetail) {
      this.bidAmount = this.getNextMinimumBid() + increment;
      this.onBidAmountChange();
    }
  }

  getStatusText(status: AuctionStatus): string {
    switch (status) {
      case AuctionStatus.Draft: return 'Taslak';
      case AuctionStatus.Pending: return 'Beklemede';
      case AuctionStatus.Active: return 'Aktif';
      case AuctionStatus.Completed: return 'Tamamlandı';
      case AuctionStatus.Cancelled: return 'İptal';
      case AuctionStatus.Paused: return 'Duraklatıldı';
      default: return 'Bilinmiyor';
    }
  }

  getStatusClass(status: AuctionStatus): string {
    switch (status) {
      case AuctionStatus.Active: return 'bg-green-100 text-green-800';
      case AuctionStatus.Pending: return 'bg-yellow-100 text-yellow-800';
      case AuctionStatus.Completed: return 'bg-blue-100 text-blue-800';
      case AuctionStatus.Cancelled: return 'bg-red-100 text-red-800';
      case AuctionStatus.Paused: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getProductTypeText(productType: AuctionProductType): string {
    return productType === AuctionProductType.Animal ? 'Hayvan' : 'Organik Ürün';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  trackByBidId(index: number, bid: AuctionBidDto): string {
    return bid.id;
  }
}
