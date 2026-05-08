import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';
import { PaginatedResponse } from '../models/ad.model';
import { interval, Subscription, switchMap, startWith } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal(0);
  private pollSub: Subscription | null = null;

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  startPolling(intervalMs = 30000): void {
    this.pollSub = interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.api.get<PaginatedResponse<Notification>>('notifications/')),
    ).subscribe(res => {
      this._notifications.set(res.results);
      this._unreadCount.set(res.results.filter(n => !n.lue).length);
    });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  markRead(id: number): void {
    this.api.patch<Notification>(`notifications/${id}/read/`, {}).subscribe(updated => {
      this._notifications.update(list => list.map(n => n.id === id ? updated : n));
      this._unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 4000, panelClass: ['snack-success'] });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 6000, panelClass: ['snack-error'] });
  }

  showInfo(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }
}
