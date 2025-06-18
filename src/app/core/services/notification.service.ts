import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../../shared/models/user-model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiService = inject(ApiService);

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  loadNotifications(): void {
    // Mock data - gerçek uygulamada API'den gelecek
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Siparişiniz hazırlandı',
        message: 'Siparişiniz kargoya verildi ve size ulaşmak için yola çıktı.',
        type: 'success',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 saat önce
      },
      {
        id: '2',
        title: 'İndirim fırsatı',
        message: 'Seçili ürünlerde %50\'ye varan indirim! Hemen keşfedin.',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 saat önce
      },
      {
        id: '3',
        title: 'Ödeme hatırlatması',
        message: 'Kart bilgilerinizi güncellemek için profil sayfanızı ziyaret edin.',
        type: 'warning',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 gün önce
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.updateUnreadCount();
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}