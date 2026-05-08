import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../../core/services/api.service';
import { Annonce, Categorie, PaginatedResponse } from '../../../core/models/ad.model';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';

@Component({
  selector: 'app-ad-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatSliderModule, MatIconModule, MatChipsModule, MatCheckboxModule,
    MatPaginatorModule, RatingStarsComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Filtres -->
        <aside class="lg:w-64 flex-shrink-0">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 class="font-bold text-gray-900 text-lg mb-6">Filtres</h2>
            <form [formGroup]="filterForm" class="space-y-5">
              <mat-form-field class="w-full">
                <mat-label>Catégorie</mat-label>
                <mat-select formControlName="categorie">
                  <mat-option value="">Toutes</mat-option>
                  @for (cat of categories(); track cat.id) {
                    <mat-option [value]="cat.slug">{{ cat.icone }} {{ cat.nom }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <div>
                <label class="text-sm text-gray-600 font-medium">Budget max (€)</label>
                <input type="range" formControlName="budget_max" min="0" max="5000" step="50"
                       class="w-full mt-2 accent-blue-600">
                <span class="text-sm text-blue-600 font-semibold">{{ filterForm.value.budget_max }}€</span>
              </div>

              <mat-checkbox formControlName="urgence" color="primary">Urgences uniquement</mat-checkbox>

              <button mat-stroked-button class="w-full" (click)="applyFilters()" type="button">
                <mat-icon>filter_list</mat-icon> Appliquer
              </button>
              <button mat-button class="w-full text-gray-400" (click)="resetFilters()" type="button">
                Réinitialiser
              </button>
            </form>
          </div>
        </aside>

        <!-- Liste -->
        <main class="flex-1">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Annonces</h1>
              <p class="text-gray-500 text-sm">{{ total() }} résultat{{ total() > 1 ? 's' : '' }}</p>
            </div>
            <mat-form-field appearance="outline" class="w-48">
              <mat-label>Trier par</mat-label>
              <mat-select [formControl]="sortControl">
                <mat-option value="-created_at">Plus récentes</mat-option>
                <mat-option value="budget_min">Budget croissant</mat-option>
                <mat-option value="-budget_max">Budget décroissant</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          @if (loading()) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="bg-white rounded-2xl h-56 animate-pulse border border-gray-100"></div>
              }
            </div>
          } @else if (annonces().length === 0) {
            <div class="text-center py-20 text-gray-400">
              <mat-icon class="text-6xl">search_off</mat-icon>
              <p class="mt-4 text-lg">Aucune annonce trouvée</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (annonce of annonces(); track annonce.id) {
                <a [routerLink]="['/annonces', annonce.id]"
                   class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  @if (annonce.images.length > 0) {
                    <img [src]="annonce.images[0].image" [alt]="annonce.titre" class="h-40 object-cover w-full">
                  } @else {
                    <div class="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <span class="text-5xl">{{ annonce.categorie?.icone || '🔧' }}</span>
                    </div>
                  }
                  <div class="p-4 flex flex-col flex-1">
                    <div class="flex items-start gap-2 mb-2">
                      @if (annonce.urgence) {
                        <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">URGENT</span>
                      }
                      @if (annonce.boost_actif) {
                        <span class="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">⭐ BOOSTÉ</span>
                      }
                    </div>
                    <h3 class="font-bold text-gray-900 text-base line-clamp-1">{{ annonce.titre }}</h3>
                    <p class="text-gray-500 text-sm mt-1 line-clamp-2 flex-1">{{ annonce.description }}</p>
                    <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <span class="text-blue-600 font-bold text-sm">{{ annonce.budget_min }}€ – {{ annonce.budget_max }}€</span>
                      <div class="flex items-center gap-1 text-gray-400 text-xs">
                        <mat-icon class="text-xs">location_on</mat-icon>
                        {{ annonce.localisation }}
                        @if (annonce.distance_km !== null) {
                          · {{ annonce.distance_km }}km
                        }
                      </div>
                    </div>
                  </div>
                </a>
              }
            </div>
            <mat-paginator
              class="mt-6"
              [length]="total()"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPage($event)">
            </mat-paginator>
          }
        </main>
      </div>
    </div>
  `,
})
export class AdListComponent implements OnInit {
  annonces = signal<Annonce[]>([]);
  categories = signal<Categorie[]>([]);
  total = signal(0);
  loading = signal(false);
  pageSize = 20;
  page = 1;

  filterForm = this.fb.group({
    categorie: [''],
    budget_max: [5000],
    urgence: [false],
  });

  sortControl = this.fb.control('-created_at');

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['categorie']) this.filterForm.patchValue({ categorie: params['categorie'] });
      if (params['search']) { /* handled in API */ }
      this.loadAnnonces();
    });
    this.api.get<PaginatedResponse<Categorie>>('categories/').subscribe(res => {
      this.categories.set(res.results);
    });
    this.sortControl.valueChanges.subscribe(() => this.loadAnnonces());
  }

  loadAnnonces(): void {
    this.loading.set(true);
    const { categorie, budget_max, urgence } = this.filterForm.value;
    const params: Record<string, string | number | boolean> = {
      page: this.page,
      page_size: this.pageSize,
      ordering: this.sortControl.value || '-created_at',
    };
    if (categorie) params['categorie'] = categorie;
    if (budget_max && budget_max < 5000) params['budget_max'] = budget_max;
    if (urgence) params['urgence'] = true;
    this.api.get<PaginatedResponse<Annonce>>('ads/', params).subscribe(res => {
      this.annonces.set(res.results);
      this.total.set(res.count);
      this.loading.set(false);
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadAnnonces();
  }

  resetFilters(): void {
    this.filterForm.reset({ categorie: '', budget_max: 5000, urgence: false });
    this.loadAnnonces();
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadAnnonces();
  }
}
