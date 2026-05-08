import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Booking } from '../../core/models/booking.model';
import { Annonce, PaginatedResponse } from '../../core/models/ad.model';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatCardModule,
    RatingStarsComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard Prestataire</h1>
          <p class="text-gray-500">Bienvenue, {{ currentUser()?.prenom }} 👋</p>
        </div>
        <a routerLink="/profil" mat-stroked-button color="primary">
          <mat-icon>edit</mat-icon> Mon profil
        </a>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        @for (kpi of kpis(); track kpi.label) {
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" [class]="kpi.bgClass">
                <mat-icon [class]="kpi.iconClass">{{ kpi.icon }}</mat-icon>
              </div>
              <span class="text-sm text-gray-500">{{ kpi.label }}</span>
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
          </div>
        }
      </div>

      <!-- Note + Profil -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="font-bold text-gray-900 mb-4">Ma note</h2>
          <div class="text-center">
            <p class="text-5xl font-bold text-blue-600">{{ currentUser()?.profile?.note_moyenne?.toFixed(1) || '—' }}</p>
            <app-rating-stars [note]="currentUser()?.profile?.note_moyenne || 0"
                              [count]="currentUser()?.profile?.nb_avis || 0" class="justify-center mt-2"></app-rating-stars>
          </div>
        </div>
        <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-gray-900">Annonces matchées</h2>
            <a routerLink="/annonces" mat-button color="primary">Voir tout</a>
          </div>
          @if (matchedAds().length === 0) {
            <p class="text-gray-400 text-center py-8">Aucune annonce correspondant à votre profil.</p>
          }
          <div class="space-y-3">
            @for (ad of matchedAds().slice(0, 5); track ad.id) {
              <a [routerLink]="['/annonces', ad.id]"
                 class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                  {{ ad.categorie?.icone || '🔧' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 text-sm truncate">{{ ad.titre }}</p>
                  <p class="text-gray-400 text-xs">{{ ad.localisation }} · {{ ad.budget_min }}€–{{ ad.budget_max }}€</p>
                </div>
                @if (ad.match_score !== null) {
                  <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full shrink-0">
                    {{ ad.match_score }}/100
                  </span>
                }
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Réservations -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-bold text-gray-900">Mes réservations</h2>
          <a routerLink="/reservations" mat-button color="primary">Voir tout</a>
        </div>
        @if (bookings().length === 0) {
          <p class="text-gray-400 text-center py-8">Aucune réservation pour le moment.</p>
        }
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="bookings()" class="w-full">
            <ng-container matColumnDef="annonce">
              <th mat-header-cell *matHeaderCellDef class="text-left">Annonce</th>
              <td mat-cell *matCellDef="let b">
                <a [routerLink]="['/annonces', b.annonce.id]" class="font-medium text-gray-900 hover:text-blue-600">
                  {{ b.annonce.titre }}
                </a>
              </td>
            </ng-container>
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let b">{{ b.annonce.client.full_name }}</td>
            </ng-container>
            <ng-container matColumnDef="montant">
              <th mat-header-cell *matHeaderCellDef>Montant</th>
              <td mat-cell *matCellDef="let b" class="font-bold text-blue-600">{{ b.prix_final }}€</td>
            </ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let b">
                <span class="px-2 py-1 rounded-full text-xs font-bold" [class]="getStatutClass(b.statut_booking)">
                  {{ getStatutLabel(b.statut_booking) }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let b" class="text-gray-500 text-sm">{{ b.created_at | date:'dd/MM/yy' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly currentUser = this.authService.currentUser$;
  bookings = signal<Booking[]>([]);
  matchedAds = signal<Annonce[]>([]);
  kpis = signal<{ label: string; value: string; icon: string; bgClass: string; iconClass: string }[]>([]);
  displayedColumns = ['annonce', 'client', 'montant', 'statut', 'date'];

  constructor(private api: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.api.get<PaginatedResponse<Booking>>('bookings/').subscribe(res => {
      this.bookings.set(res.results);
      this.computeKpis(res.results);
    });
    this.api.get<Annonce[]>('ads/matched/').subscribe(ads => this.matchedAds.set(ads));
  }

  computeKpis(bookings: Booking[]): void {
    const terminees = bookings.filter(b => b.statut_booking === 'termine');
    const enCours = bookings.filter(b => ['accepte', 'en_cours'].includes(b.statut_booking));
    const ca = terminees.reduce((sum, b) => sum + (b.prix_final - b.commission), 0);
    this.kpis.set([
      { label: 'CA total net', value: `${ca.toFixed(2)}€`, icon: 'euro', bgClass: 'bg-green-100', iconClass: 'text-green-600' },
      { label: 'En cours', value: String(enCours.length), icon: 'pending', bgClass: 'bg-blue-100', iconClass: 'text-blue-600' },
      { label: 'Note moyenne', value: this.currentUser()?.profile?.note_moyenne?.toFixed(1) || '—', icon: 'star', bgClass: 'bg-yellow-100', iconClass: 'text-yellow-600' },
      { label: 'Missions', value: String(terminees.length), icon: 'check_circle', bgClass: 'bg-purple-100', iconClass: 'text-purple-600' },
    ]);
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      devis_envoye: 'bg-gray-100 text-gray-700',
      accepte: 'bg-blue-100 text-blue-700',
      en_cours: 'bg-yellow-100 text-yellow-700',
      termine: 'bg-green-100 text-green-700',
      litige: 'bg-red-100 text-red-700',
      annule: 'bg-gray-100 text-gray-500',
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
