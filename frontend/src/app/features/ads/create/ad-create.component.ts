import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Categorie, PaginatedResponse, Annonce } from '../../../core/models/ad.model';
import { UploadZoneComponent } from '../../../shared/components/upload-zone/upload-zone.component';

@Component({
  selector: 'app-ad-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatStepperModule,
    MatSelectModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, UploadZoneComponent,
  ],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-8">Publier une annonce</h1>

      <mat-stepper [linear]="true" #stepper>
        <!-- Étape 1 -->
        <mat-step [stepControl]="step1">
          <ng-template matStepLabel>Description</ng-template>
          <form [formGroup]="step1" class="space-y-4 pt-4">
            <mat-form-field class="w-full">
              <mat-label>Titre de votre annonce</mat-label>
              <input matInput formControlName="titre" placeholder="Ex: Réparation fuite robinet cuisine">
              @if (step1.get('titre')?.touched && step1.get('titre')?.invalid) {
                <mat-error>Titre requis (min. 5 caractères)</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Description détaillée</mat-label>
              <textarea matInput formControlName="description" rows="5"
                        placeholder="Décrivez précisément ce dont vous avez besoin..."></textarea>
              @if (step1.get('description')?.touched && step1.get('description')?.invalid) {
                <mat-error>Description requise (min. 20 caractères)</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>Catégorie</mat-label>
              <mat-select formControlName="categorie_id">
                <mat-option value="">Aucune catégorie</mat-option>
                @for (cat of categories(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.icone }} {{ cat.nom }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="flex justify-end">
              <button mat-raised-button color="primary" matStepperNext [disabled]="step1.invalid" type="button">
                Suivant
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Étape 2 -->
        <mat-step [stepControl]="step2">
          <ng-template matStepLabel>Budget & Délai</ng-template>
          <form [formGroup]="step2" class="space-y-4 pt-4">
            <div class="grid grid-cols-2 gap-4">
              <mat-form-field>
                <mat-label>Budget minimum (€)</mat-label>
                <input matInput type="number" formControlName="budget_min" min="0">
                @if (step2.get('budget_min')?.touched && step2.get('budget_min')?.invalid) {
                  <mat-error>Requis</mat-error>
                }
              </mat-form-field>
              <mat-form-field>
                <mat-label>Budget maximum (€)</mat-label>
                <input matInput type="number" formControlName="budget_max" min="0">
                @if (step2.get('budget_max')?.touched && step2.get('budget_max')?.invalid) {
                  <mat-error>Requis</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field class="w-full">
              <mat-label>Date souhaitée</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date_souhaitee">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-checkbox formControlName="urgence" color="warn">
              🔴 Demande urgente (visible en priorité)
            </mat-checkbox>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious type="button">Retour</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="step2.invalid" type="button">
                Suivant
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Étape 3 -->
        <mat-step [stepControl]="step3">
          <ng-template matStepLabel>Localisation & Photos</ng-template>
          <form [formGroup]="step3" class="space-y-4 pt-4">
            <mat-form-field class="w-full">
              <mat-label>Adresse / Localisation</mat-label>
              <input matInput formControlName="localisation" placeholder="10 rue de la Paix, Paris 75001">
              <mat-icon matSuffix>location_on</mat-icon>
              @if (step3.get('localisation')?.touched && step3.get('localisation')?.invalid) {
                <mat-error>Localisation requise</mat-error>
              }
            </mat-form-field>

            <div class="grid grid-cols-2 gap-4">
              <mat-form-field>
                <mat-label>Latitude</mat-label>
                <input matInput type="number" formControlName="latitude" step="0.000001">
              </mat-form-field>
              <mat-form-field>
                <mat-label>Longitude</mat-label>
                <input matInput type="number" formControlName="longitude" step="0.000001">
              </mat-form-field>
            </div>

            <button mat-stroked-button type="button" (click)="getLocation()" class="w-full">
              <mat-icon>my_location</mat-icon> Utiliser ma position actuelle
            </button>

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Photos (optionnel)</p>
              <app-upload-zone (filesSelected)="onFilesSelected($event)"></app-upload-zone>
            </div>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious type="button">Retour</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="step3.invalid" type="button">
                Suivant
              </button>
            </div>
          </form>
        </mat-step>

        <!-- Étape 4 : Récap -->
        <mat-step>
          <ng-template matStepLabel>Récapitulatif</ng-template>
          <div class="pt-4 space-y-4">
            <div class="bg-gray-50 rounded-xl p-6 space-y-3">
              <h2 class="font-bold text-gray-900 text-lg">{{ step1.value.titre }}</h2>
              <p class="text-gray-600 text-sm">{{ step1.value.description }}</p>
              <div class="flex gap-4 text-sm">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {{ step2.value.budget_min }}€ — {{ step2.value.budget_max }}€
                </span>
                @if (step2.value.urgence) {
                  <span class="bg-red-100 text-red-800 px-2 py-1 rounded">🔴 Urgent</span>
                }
              </div>
              <p class="text-gray-500 text-sm flex items-center gap-1">
                <mat-icon class="text-sm">location_on</mat-icon>
                {{ step3.value.localisation }}
              </p>
              @if (selectedFiles().length > 0) {
                <p class="text-gray-400 text-sm">{{ selectedFiles().length }} photo(s) sélectionnée(s)</p>
              }
            </div>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious type="button">Retour</button>
              <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="loading()" type="button">
                @if (loading()) { Publication en cours... } @else { Publier l'annonce }
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
})
export class AdCreateComponent implements OnInit {
  loading = signal(false);
  categories = signal<Categorie[]>([]);
  selectedFiles = signal<File[]>([]);

  step1 = this.fb.group({
    titre: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    categorie_id: [null],
  });

  step2 = this.fb.group({
    budget_min: [null, [Validators.required, Validators.min(0)]],
    budget_max: [null, [Validators.required, Validators.min(0)]],
    date_souhaitee: [null],
    urgence: [false],
  });

  step3 = this.fb.group({
    localisation: ['', Validators.required],
    latitude: [48.8566, Validators.required],
    longitude: [2.3522, Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.api.get<PaginatedResponse<Categorie>>('categories/').subscribe(res => {
      this.categories.set(res.results);
    });
  }

  onFilesSelected(files: File[]): void {
    this.selectedFiles.set(files);
  }

  getLocation(): void {
    navigator.geolocation?.getCurrentPosition(pos => {
      this.step3.patchValue({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    });
  }

  onSubmit(): void {
    this.loading.set(true);
    const formData = new FormData();
    const { titre, description, categorie_id } = this.step1.value;
    const { budget_min, budget_max, urgence, date_souhaitee } = this.step2.value;
    const { localisation, latitude, longitude } = this.step3.value;

    formData.append('titre', titre!);
    formData.append('description', description!);
    if (categorie_id) formData.append('categorie_id', String(categorie_id));
    formData.append('budget_min', String(budget_min));
    formData.append('budget_max', String(budget_max));
    if (urgence) formData.append('urgence', 'true');
    if (date_souhaitee) formData.append('date_souhaitee', (date_souhaitee as Date).toISOString().split('T')[0]);
    formData.append('localisation', localisation!);
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    this.selectedFiles().forEach((f, i) => formData.append('images', f));

    this.api.postFormData<Annonce>('ads/', formData).subscribe({
      next: (annonce) => {
        this.loading.set(false);
        this.notif.showSuccess('Annonce publiée avec succès !');
        this.router.navigate(['/annonces', annonce.id]);
      },
      error: () => this.loading.set(false),
    });
  }
}
