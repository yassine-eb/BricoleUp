import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Booking } from '../../core/models/booking.model';
import { PaginatedResponse } from '../../core/models/ad.model';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatDialogModule,
  ],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Mes Réservations</h1>
        <mat-form-field appearance="outline" class="w-48" subscriptSizing="dynamic">
          <mat-label>Filtrer par statut</mat-label>
          <mat-select [formControl]="statusFilter">
            <mat-option value="">Tous</mat-option>
            <mat-option value="devis_envoye">Devis envoyé</mat-option>
            <mat-option value="accepte">Accepté</mat-option>
            <mat-option value="en_cours">En cours</mat-option>
            <mat-option value="termine">Terminé</mat-option>
            <mat-option value="litige">Litige</mat-option>
            <mat-option value="annule">Annulé</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          }
        </div>
      } @else if (filteredBookings().length === 0) {
        <div class="text-center py-20 text-gray-400">
          <mat-icon class="text-6xl">event_busy</mat-icon>
          <p class="mt-4 text-lg">Aucune réservation</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (booking of filteredBookings(); track booking.id) {
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <!-- En-tête -->
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <a [routerLink]="['/annonces', booking.annonce.id]"
                     class="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                    {{ booking.annonce.titre }}
                  </a>
                  <p class="text-gray-500 text-sm mt-1">
                    @if (isClient()) {
                      Prestataire : <strong>{{ booking.prestataire.full_name }}</strong>
                    } @else {
                      Client : <strong>{{ booking.annonce.client.full_name }}</strong>
                    }
                  </p>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <span class="px-3 py-1 rounded-full text-sm font-bold" [class]="getStatutClass(booking.statut_booking)">
                    {{ getStatutLabel(booking.statut_booking) }}
                  </span>
                  <span class="text-blue-600 font-bold text-lg">{{ booking.prix_final }}€</span>
                </div>
              </div>

              <!-- Timeline statut -->
              <div class="flex items-center gap-1 mb-4 overflow-x-auto">
                @for (step of statusSteps; track step.value) {
                  <div class="flex items-center gap-1 shrink-0">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                         [class.bg-blue-600]="isStepActive(booking.statut_booking, step.value)"
                         [class.text-white]="isStepActive(booking.statut_booking, step.value)"
                         [class.bg-gray-200]="!isStepActive(booking.statut_booking, step.value)"
                         [class.text-gray-500]="!isStepActive(booking.statut_booking, step.value)">
                      {{ $index + 1 }}
                    </div>
                    <span class="text-xs text-gray-500">{{ step.label }}</span>
                    @if (!$last) {
                      <div class="w-6 h-0.5 bg-gray-200 mx-1"></div>
                    }
                  </div>
                }
              </div>

              @if (booking.devis) {
                <div class="bg-gray-50 rounded-xl p-4 mb-4">
                  <p class="text-sm font-medium text-gray-700 mb-1">Devis</p>
                  <p class="text-sm text-gray-600">{{ booking.devis.description }}</p>
                  <p class="text-sm text-gray-500 mt-1">Durée estimée : {{ booking.devis.duree_jours }} jour(s)</p>
                </div>
              }

              <!-- Actions -->
              <div class="flex flex-wrap gap-2">
                @if (isClient() && booking.statut_booking === 'devis_envoye') {
                  <button mat-raised-button color="primary" (click)="acceptDevis(booking.id)">
                    <mat-icon>check</mat-icon> Accepter le devis
                  </button>
                }
                @if (isClient() && booking.statut_booking === 'accepte') {
                  <button mat-raised-button color="primary" (click)="validateBooking(booking.id)">
                    <mat-icon>verified</mat-icon> Valider la prestation
                  </button>
                }
                @if (['accepte','en_cours'].includes(booking.statut_booking)) {
                  <button mat-stroked-button color="warn" (click)="openDispute(booking.id)">
                    <mat-icon>report</mat-icon> Signaler un litige
                  </button>
                }
                <button mat-stroked-button routerLink="/messages">
                  <mat-icon>chat</mat-icon> Messages
                </button>
                @if (isClient() && booking.statut_booking === 'termine' && !booking.devis) {
                  <button mat-stroked-button color="accent" routerLink="/avis">
                    <mat-icon>star</mat-icon> Laisser un avis
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BookingsListComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(false);
  statusFilter = new FormControl('');
  readonly isClient = this.authService.isClient$;

  statusSteps = [
    { value: 'devis_envoye', label: 'Devis' },
    { value: 'accepte', label: 'Accepté' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
  ];

  filteredBookings = signal<Booking[]>([]);

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private notif: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.api.get<PaginatedResponse<Booking>>('bookings/').subscribe(res => {
      this.bookings.set(res.results);
      this.filteredBookings.set(res.results);
      this.loading.set(false);
    });
    this.statusFilter.valueChanges.subscribe(val => {
      if (!val) { this.filteredBookings.set(this.bookings()); }
      else { this.filteredBookings.set(this.bookings().filter(b => b.statut_booking === val)); }
    });
  }

  acceptDevis(id: string): void {
    this.api.post<Booking>(`bookings/${id}/accept/`, {}).subscribe({
      next: (b) => {
        this.bookings.update(list => list.map(x => x.id === id ? b : x));
        this.filteredBookings.update(list => list.map(x => x.id === id ? b : x));
        this.notif.showSuccess('Devis accepté ! La prestation peut commencer.');
      },
    });
  }

  validateBooking(id: string): void {
    this.api.post<Booking>(`bookings/${id}/validate/`, {}).subscribe({
      next: (b) => {
        this.bookings.update(list => list.map(x => x.id === id ? b : x));
        this.filteredBookings.update(list => list.map(x => x.id === id ? b : x));
        this.notif.showSuccess('Prestation validée ! Le paiement a été libéré.');
      },
    });
  }

  openDispute(id: string): void {
    if (confirm('Voulez-vous signaler un litige pour cette réservation ?')) {
      this.api.post<Booking>(`bookings/${id}/dispute/`, {}).subscribe({
        next: (b) => {
          this.bookings.update(list => list.map(x => x.id === id ? b : x));
          this.filteredBookings.update(list => list.map(x => x.id === id ? b : x));
          this.notif.showInfo('Litige signalé. Notre équipe vous contactera sous 48h.');
        },
      });
    }
  }

  isStepActive(current: string, step: string): boolean {
    const order = ['devis_envoye', 'accepte', 'en_cours', 'termine'];
    return order.indexOf(current) >= order.indexOf(step);
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      devis_envoye: 'bg-gray-100 text-gray-700', accepte: 'bg-blue-100 text-blue-700',
      en_cours: 'bg-yellow-100 text-yellow-700', termine: 'bg-green-100 text-green-700',
      litige: 'bg-red-100 text-red-700', annule: 'bg-gray-100 text-gray-400',
    };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      devis_envoye: 'Devis envoyé', accepte: 'Accepté', en_cours: 'En cours',
      termine: 'Terminé', litige: 'Litige', annule: 'Annulé',
    };
    return map[statut] || statut;
  }
}
