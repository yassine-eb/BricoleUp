import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  getCurrentPosition(): Observable<GeoPosition> {
    if (!navigator.geolocation) {
      return throwError(() => new Error('La géolocalisation n\'est pas supportée par ce navigateur.'));
    }
    return from(
      new Promise<GeoPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }),
    );
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
