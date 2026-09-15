import { Injectable, inject } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class DashboardRealtimeService {
  private readonly authService = inject(AuthService);
  private connection: HubConnection | null = null;
  private onUpdateHandler: (() => void) | null = null;

  connect(onDashboardUpdated: () => void): void {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.onUpdateHandler = onDashboardUpdated;

    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    if (this.connection?.state === HubConnectionState.Connecting) {
      return;
    }

    if (this.connection) {
      void this.connection.stop();
      this.connection = null;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/dashboard`, {
        accessTokenFactory: () => this.authService.getToken() ?? '',
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('DashboardUpdated', () => {
      this.onUpdateHandler?.();
    });

    this.connection.onreconnected(() => {
      this.onUpdateHandler?.();
    });

    void this.startConnection();
  }

  disconnect(): void {
    this.onUpdateHandler = null;

    if (!this.connection) {
      return;
    }

    void this.connection.stop();
    this.connection = null;
  }

  private async startConnection(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.start();
    } catch {
      this.connection = null;
      window.setTimeout(() => {
        if (this.onUpdateHandler) {
          this.connect(this.onUpdateHandler);
        }
      }, 3000);
    }
  }
}
