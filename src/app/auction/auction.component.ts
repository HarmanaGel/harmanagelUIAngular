import { Component, OnInit, OnDestroy } from '@angular/core';
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
    public authService: AuthService
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
    // Açık arttırma güncellemeleri
    this.hubService.auctionUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(auction => {
        if (auction) {
          this.updateAuctionInList(auction);
        }
      });

    // Yeni teklifler
    this.hubService.bidPlaced$
      .pipe(takeUntil(this.destroy$))
      .subscribe(bid => {
        if (bid) {
          this.handleNewBid(bid.auctionId, bid.bidAmount);
        }
      });

    // Açık arttırma bitti
    this.hubService.auctionEnded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event) {
          this.handleAuctionEnded(event.auctionId);
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
    const index = this.auctions.findIndex(a => a.id === updatedAuction.id);
    if (index !== -1) {
      this.auctions[index] = updatedAuction;
    }
  }

  private handleNewBid(auctionId: string, bidAmount: number): void {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (auction) {
      auction.currentPrice = bidAmount;
      auction.totalBids++;
    }
  }

  private handleAuctionEnded(auctionId: string): void {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (auction) {
      auction.status = AuctionStatus.Completed;
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
