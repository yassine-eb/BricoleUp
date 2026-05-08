import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminShellComponent {
  annOpen = true;

  toggleSidebar() {
    document.getElementById('adminSidebar')?.classList.toggle('open');
  }
}
