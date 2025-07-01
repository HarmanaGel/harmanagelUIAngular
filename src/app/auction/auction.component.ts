import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AuctionService } from '../core/services/auction.service';
import { AuctionHubService } from '../core/services/auction-hub.service';
import { AuthService } from '../core/services/auth.service';
import { AuctionDto, AuctionStatus, AuctionProductType, PagedResultDto } from '../shared/models/auction.model';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './auction.component.html'
})
export class AuctionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  auctions: AuctionDto[] = [];
  loading = false;
  totalCount = 0;
  pageSize = 12;
  currentPage = 1;
  searchTerm = '';
  selectedStatus?: AuctionStatus;
  selectedProductType?: AuctionProductType;
  connectionStatus = 'Disconnected';

  // Enums for template
  AuctionStatus = AuctionStatus;
  AuctionProductType = AuctionProductType;
  Math = Math;

  constructor(
    private auctionService: AuctionService,
    private hubService: AuctionHubService,
    public authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeSignalR();
    this.loadAuctions();
    this.setupHubEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.hubService.stopConnection();
  }

  private async initializeSignalR(): Promise<void> {
    try {
      await this.hubService.startConnection();
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
    // Yeni bid geldiğinde
    this.hubService.newBid$
      .pipe(takeUntil(this.destroy$))
      .subscribe(bidData => {
        if (bidData) {
          this.handleNewBid(bidData.AuctionId, bidData.BidAmount);
        }
      });

    // Açık arttırma güncellendiğinde
    this.hubService.auctionUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(auction => {
        if (auction) {
          this.updateAuctionInList(auction);
        }
      });

    // Süre uzatıldığında
    this.hubService.timeExtended$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleTimeExtended(data.AuctionId, data.NewEndTime);
        }
      });

    // Açık arttırma başladığında
    this.hubService.auctionStarted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleAuctionStarted(data.AuctionId);
        }
      });

    // Açık arttırma bittiğinde
    this.hubService.auctionEnded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleAuctionEnded(data.AuctionId);
        }
      });

    // Açık arttırma onaylandığında
    this.hubService.auctionApproved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleAuctionApproved(data.AuctionId);
        }
      });

    // Açık arttırma iptal edildiğinde
    this.hubService.auctionCancelled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleAuctionCancelled(data.AuctionId);
        }
      });

    // Timer güncellemeleri
    this.hubService.timerUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleTimerUpdate(data.AuctionId, data.RemainingSeconds);
        }
      });

    // Genel açık arttırma durum değişiklikleri
    this.hubService.auctionStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleStatusChanged(data.AuctionId, data.Status);
        }
      });
  }

  loadAuctions(): void {
    this.loading = true;

    const request = {
      skipCount: (this.currentPage - 1) * this.pageSize,
      maxResultCount: this.pageSize,
      filter: this.searchTerm || undefined,
      status: this.selectedStatus !== undefined ? this.selectedStatus : undefined,
      productType: this.selectedProductType,
      sorting: 'EndTime'
    };

    this.auctionService.getList(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResultDto<AuctionDto>) => {
          this.auctions = result.items;
          this.totalCount = result.totalCount;
          this.loading = false;
        },
        error: (error) => {
          console.error('Açık arttırmalar yüklenirken hata:', error);
          this.loading = false;
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAuctions();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAuctions();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAuctions();
  }

  private updateAuctionInList(updatedAuction: AuctionDto): void {
    this.ngZone.run(() => {
      const index = this.auctions.findIndex(a => a.id === updatedAuction.id);
      if (index !== -1) {
        this.auctions[index] = updatedAuction;
        console.log('✅ Auction listesi güncellendi:', updatedAuction.title);
        this.cdr.detectChanges();
      }
    });
  }

  private handleNewBid(auctionId: string, bidAmount: number): void {
    this.ngZone.run(() => {
      const auction = this.auctions.find(a => a.id === auctionId);
      if (auction) {
        auction.currentPrice = bidAmount;
        auction.totalBids++;
        console.log('✅ Auction listesi güncellendi - Yeni bid:', bidAmount);
        this.cdr.detectChanges();
      }
    });
  }

  private handleAuctionEnded(auctionId: string): void {
    this.ngZone.run(() => {
      const auction = this.auctions.find(a => a.id === auctionId);
      if (auction) {
        auction.status = AuctionStatus.Completed;
        console.log(`🏁 Açık arttırma bitti: ${auctionId}`);
        this.cdr.detectChanges();
      }
    });
  }

  private handleTimeExtended(auctionId: string, newEndTime: string): void {
    this.ngZone.run(() => {
      const auction = this.auctions.find(a => a.id === auctionId);
      if (auction) {
        auction.endTime = new Date(newEndTime);
        console.log(`⏰ Açık arttırma süresi uzatıldı: ${auctionId}`);
        this.cdr.detectChanges();
      }
    });
  }

  private handleAuctionStarted(auctionId: string): void {
    this.ngZone.run(() => {
      const auction = this.auctions.find(a => a.id === auctionId);
      if (auction) {
        auction.status = AuctionStatus.Active;
        console.log(`🎯 Açık arttırma başladı: ${auctionId}`);
        this.cdr.detectChanges();
      }
    });
  }

  private handleAuctionApproved(auctionId: string): void {
    this.ngZone.run(() => {
      // Yeni onaylanan açık arttırma - listeyi yenile
      console.log(`✅ Yeni açık arttırma onaylandı: ${auctionId}`);
      this.loadAuctions();
    });
  }

  private handleAuctionCancelled(auctionId: string): void {
    this.ngZone.run(() => {
      const auction = this.auctions.find(a => a.id === auctionId);
      if (auction) {
        auction.status = AuctionStatus.Cancelled;
        console.log(`❌ Açık arttırma iptal edildi: ${auctionId}`);
        this.cdr.detectChanges();
      }
    });
  }

  private handleTimerUpdate(auctionId: string, remainingSeconds: number): void {
    // Timer güncellemelerini UI'da gösterebiliriz
    // Şu anda sadece console'a yazdırıyoruz
    if (remainingSeconds % 30 === 0) { // Her 30 saniyede bir log
      console.log(`⏰ Timer güncelleme: ${auctionId} - ${remainingSeconds} saniye kaldı`);
    }
  }

  private handleStatusChanged(auctionId: string, status: string): void {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (auction) {
      console.log(`📊 Açık arttırma durumu değişti: ${auctionId} -> ${status}`);
      // Status'u enum'a çevirebiliriz
      this.loadAuctions(); // Güvenli seçenek: listeyi yenile
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

  getRemainingTime(endTime: Date): string {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Bitti';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}g ${hours}s`;
    } else if (hours > 0) {
      return `${hours}s ${minutes}d`;
    } else {
      return `${minutes}d`;
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }
}
