import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    footer { padding: 48px; background: #1B3C6B; color: #fff; font-family: "DM Sans",system-ui,sans-serif; }
    .footer-logo { margin-bottom: 28px; font-family: Poppins,system-ui,sans-serif; font-size: 1.6rem; font-weight: 800; }
    .footer-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 32px; }
    h3 { margin: 0 0 16px; color: #fff; font-size: .9rem; letter-spacing: .1em; text-transform: uppercase; }
    a { display: block; margin-bottom: 9px; color: rgba(255,255,255,.7); font-size: .85rem; text-decoration: none; transition: color .2s ease; }
    a:hover { color: #F97316; }
    hr { margin: 32px 0; border: 0; border-top: 1px solid rgba(255,255,255,.15); }
    p { margin: 0; color: rgba(255,255,255,.5); font-size: .8rem; text-align: center; }
    @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr; } footer { padding: 48px 22px; } }
  `],
  template: `
    <footer>
      <div style="width:min(1100px,100%);margin:0 auto;">
        <div class="footer-logo"><span style="color:#fff">Bricole</span><span style="color:#F97316">Up</span></div>
        <div class="footer-grid">
          <div>
            <h3>BricoleUp</h3>
            <a routerLink="/">À propos</a>
            <a routerLink="/">Comment ça marche</a>
            <a routerLink="/">Presse</a>
            <a routerLink="/">Blog</a>
          </div>
          <div>
            <h3>Particuliers</h3>
            <a routerLink="/annonces/create">Déposer une annonce</a>
            <a routerLink="/annonces">Trouver un artisan</a>
            <a routerLink="/">Tarifs</a>
          </div>
          <div>
            <h3>Professionnels</h3>
            <a routerLink="/auth/register">Créer mon profil</a>
            <a routerLink="/">BricoleUp Pro</a>
            <a routerLink="/">KYC & Vérification</a>
          </div>
          <div>
            <h3>Légal</h3>
            <a routerLink="/">CGU</a>
            <a routerLink="/">Confidentialité</a>
            <a routerLink="/">Cookies</a>
            <a routerLink="/">Contact</a>
          </div>
        </div>
        <hr>
        <p>© {{ year }} BricoleUp — Tous droits réservés</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
