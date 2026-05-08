import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Annonce } from '../../../core/models/ad.model';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';

@Component({
  selector: 'app-ad-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, MatDialogModule,
    RatingStarsComponent,
  ],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-72 bg-gray-200 rounded-2xl"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      } @else if (annonce()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Colonne principale -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Galerie -->
            @if (annonce()!.images.length > 0) {
              <div class="grid grid-cols-3 gap-2">
                @for (img of annonce()!.images; track img.id) {
                  <img [src]="img.image" [alt]="annonce()!.titre"
                       class="rounded-xl h-40 object-cover w-full" [class.col-span-3]="$first">
                }
              </div>
            } @else {
              <div class="h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <span class="text-7xl">{{ annonce()!.categorie?.icone || '🔧' }}</span>
              </div>
            }

            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              @if (annonce()!.urgence) {
                <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">🔴 URGENT</span>
              }
              @if (annonce()!.boost_actif) {
                <span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">⭐ Annonce boostée</span>
              }
              <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                {{ annonce()!.categorie?.nom || 'Divers' }}
              </span>
            </div>

            <!-- Titre et description -->
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ annonce()!.titre }}</h1>
              <p class="text-gray-500 text-sm mt-2 flex items-center gap-2">
                <mat-icon class="text-sm">location_on</mat-icon>
                {{ annonce()!.localisation }}
                @if (annonce()!.distance_km !== null) {
                  · <strong>{{ annonce()!.distance_km }} km</strong>
                }
              </p>
            </div>
            <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ annonce()!.description }}</p>

            <mat-divider></mat-divider>

            <!-- Client -->
            <div class="flex items-center gap-4">
              @if (annonce()!.client.avatar) {
                <img [src]="annonce()!.client.avatar" alt="Avatar" class="w-12 h-12 rounded-full object-cover">
              } @else {
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                  {{ annonce()!.client.prenom[0] }}{{ annonce()!.client.nom[0] }}
                </div>
              }
              <div>
                <p class="font-semibold text-gray-900">{{ annonce()!.client.full_name }}</p>
                <p class="text-gray-400 text-sm">Client · {{ annonce()!.client.localisation }}</p>
              </div>
            </div>
          </div>

          <!-- Colonne latérale -->
          <div class="space-y-4">
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
              <div class="text-center mb-4">
                <p class="text-gray-500 text-sm">Budget estimé</p>
                <p class="text-3xl font-bold text-blue-600">{{ annonce()!.budget_min }}€ – {{ annonce()!.budget_max }}€</p>
              </div>

              @if (annonce()!.date_souhaitee) {
                <div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <mat-icon class="text-sm">calendar_today</mat-icon>
                  Souhaité le {{ annonce()!.date_souhaitee | date:'dd/MM/yyyy' }}
                </div>
              }

              @if (isPrestataire()) {
                <button mat-raised-button color="primary" class="w-full py-3 text-base font-semibold"
                        (click)="sendDevis()">
                  <mat-icon>send</mat-icon> Envoyer un devis
                </button>
              } @else if (!isAuthenticated()) {
                <a routerLink="/auth/login" mat-raised-button color="primary" class="w-full py-3 text-base">
                  Se connecter pour répondre
                </a>
              }

              <div class="mt-4 space-y-2 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-sm text-green-500">verified</mat-icon>
                  Paiement sécurisé
                </div>
                <div class="flex items-center gap-2">
                  <mat-icon class="text-sm text-green-500">support_agent</mat-icon>
                  Support disponible
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdDetailComponent implements OnInit {
  annonce = signal<Annonce | null>(null);
  loading = signal(true);

  readonly isAuthenticated = this.authService.isAuthenticated$;
  readonly isPrestataire = this.authService.isPrestataire$;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<Annonce>(`ads/${id}/`).subscribe({
      next: a => { this.annonce.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  sendDevis(): void {
    // Navigation vers booking create, avec annonce_id en query param
    window.location.href = `/reservations/new?annonce=${this.annonce()?.id}`;
  }
}
