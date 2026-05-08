import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, interval, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { WsMessage } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private messages$ = new Subject<WsMessage>();
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private conversationId: number | null = null;

  readonly messages = this.messages$.asObservable();

  constructor(private authService: AuthService) {}

  connect(conversationId: number): void {
    this.conversationId = conversationId;
    this.reconnectAttempts = 0;
    this.openConnection();
  }

  disconnect(): void {
    this.destroy$.next();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(data: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  private openConnection(): void {
    const token = this.authService.getAccessToken();
    if (!token || !this.conversationId) return;

    const url = `${environment.wsUrl}/chat/${this.conversationId}/?token=${token}`;
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        this.messages$.next(data);
      } catch {
        // Malformed message — ignore
      }
    };

    this.socket.onclose = (event) => {
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        setTimeout(() => this.openConnection(), 2000 * this.reconnectAttempts);
      }
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.complete();
  }
}
