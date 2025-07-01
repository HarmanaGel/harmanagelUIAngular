import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuctionService } from '../../core/services/auction.service';
import { CreateAuctionDto, AuctionProductType } from '../../shared/models/auction.model';

@Component({
  selector: 'app-auction-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './auction-create.component.html',
  styleUrl: './auction-create.component.css'
})
export class AuctionCreateComponent {
  auction: CreateAuctionDto = {
    title: '',
    description: '',
    startingPrice: 100,
    minimumBidIncrement: 10,
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün sonra
    autoExtensionMinutes: 5,
    productType: AuctionProductType.Animal,
    productId: '00000000-0000-0000-0000-000000000001' // Test için sabit ID
  };

  loading = false;
  error = '';

  // Enum reference for template
  AuctionProductType = AuctionProductType;

  constructor(
    private auctionService: AuctionService,
    public router: Router
  ) {
    // Başlangıç zamanını şimdi + 1 dakika yap
    this.auction.startTime = new Date(Date.now() + 60 * 1000);
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.loading = true;
    this.error = '';

    this.auction.productId = this.GuidGenerator();
    this.auctionService.create(this.auction).subscribe({
      next: (result) => {
        console.log('Açık arttırma oluşturuldu:', result);
        this.router.navigate(['/auction']);
      },
      error: (error) => {
        console.error('Açık arttırma oluşturulurken hata:', error);
        this.error = error.error?.message || 'Açık arttırma oluşturulamadı';
        this.loading = false;
      }
    });
  }

  private validateForm(): boolean {
    this.error = '';

    if (!this.auction.title?.trim()) {
      this.error = 'Başlık gereklidir';
      return false;
    }

    if (!this.auction.description?.trim()) {
      this.error = 'Açıklama gereklidir';
      return false;
    }

    if (this.auction.startingPrice <= 0) {
      this.error = 'Başlangıç fiyatı 0\'dan büyük olmalıdır';
      return false;
    }

    if (this.auction.minimumBidIncrement <= 0) {
      this.error = 'Minimum artış miktarı 0\'dan büyük olmalıdır';
      return false;
    }

    const now = new Date();
    if (new Date(this.auction.startTime) <= now) {
      this.error = 'Başlangıç zamanı gelecekte olmalıdır';
      return false;
    }

    if (new Date(this.auction.endTime) <= new Date(this.auction.startTime)) {
      this.error = 'Bitiş zamanı başlangıç zamanından sonra olmalıdır';
      return false;
    }

    return true;
  }

  formatDateTime(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onStartTimeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.auction.startTime = new Date(input.value);
  }

  onEndTimeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.auction.endTime = new Date(input.value);
  }
  GuidGenerator() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
}

