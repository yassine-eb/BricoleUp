import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminComponent implements AfterViewInit {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngAfterViewInit(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.router.navigate(['/admin-login']);
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Charger les stats KPI
    this.http.get<any>(`${environment.apiUrl}/auth/admin/stats/`, { headers }).subscribe({
      next: (stats) => this.updateKpi(stats),
      error: () => this.showError('Session admin invalide ou expiree. Reconnecte-toi depuis la page admin.'),
    });

    // Charger les utilisateurs
    this.http.get<any[]>(`${environment.apiUrl}/auth/admin/users/`, { headers }).subscribe({
      next: (users) => this.initTable(this.mapUsers(users)),
      error: () => {
        this.showError('Impossible de charger les utilisateurs. Verifie que tu es connecte avec un compte admin.');
        this.initTable([]);
      },
    });
  }

  private showError(message: string): void {
    const el = document.getElementById('adminUsersError');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  private updateKpi(stats: any): void {
    const set = (id: string, val: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('kpi-total', stats.total_users.toLocaleString('fr-FR'));
    set('kpi-total-trend', `↑ +${stats.new_users_month} ce mois`);
    set('kpi-prestataires', stats.prestataires_actifs.toLocaleString('fr-FR'));
    set('kpi-prestataires-trend', `↑ +${stats.prestataires_month} ce mois`);
    set('kpi-kyc', stats.kyc_pending.toLocaleString('fr-FR'));
    set('kpi-suspendus', stats.comptes_suspendus.toLocaleString('fr-FR'));
    set('kpi-suspendus-trend', `+${stats.suspendus_semaine} cette semaine`);
  }

  private mapUsers(users: any[]): any[] {
    const kycMap: Record<string, string> = {
      pending: 'En attente', verified: 'Vérifié', rejected: 'Rejeté'
    };
    return users.map((u: any) => ({
      id: u.id,
      nom: `${u.prenom} ${u.nom}`,
      email: u.email,
      role: u.role === 'client' ? 'Client' : u.role === 'prestataire' ? 'Prestataire' : 'Admin',
      kyc: kycMap[u.kyc_status] || 'N/A',
      abo: u.profile?.abonnement === 'pro' ? 'Pro' : 'Gratuit',
      active: u.is_active !== false,
      ville: u.localisation || '—',
      date: new Date(u.date_joined).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      last: 'Récemment',
      note: u.profile?.note_moyenne ? String(u.profile.note_moyenne.toFixed(1)) : 'N/A',
      avis: u.profile?.nb_avis ? `${u.profile.nb_avis} avis` : '',
      job: u.profile?.competences?.[0] || '',
      recent: true,
    }));
  }

  private initTable(tableData: any[]): void {

    let filtered = [...tableData], currentPage = 1, perPage = 10, sortKey = '', sortDir = 1;
    const tbody = document.getElementById('tableBody')!;
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const roleFilter = document.getElementById('roleFilter') as HTMLSelectElement;
    const kycFilter = document.getElementById('kycFilter') as HTMLSelectElement;
    const aboFilter = document.getElementById('aboFilter') as HTMLSelectElement;
    const periodFilter = document.getElementById('periodFilter') as HTMLSelectElement;
    const resultBadge = document.getElementById('resultBadge')!;
    const pageInfo = document.getElementById('pageInfo')!;
    const pager = document.getElementById('pager')!;
    const bulkBar = document.getElementById('bulkBar')!;
    const bulkCount = document.getElementById('bulkCount')!;

    const initials = (name: string) => name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
    const roleClass = (role: string) => role === 'Client' ? 'role-client' : role === 'Admin' ? 'role-admin' : 'role-prestataire';
    const kycClass = (kyc: string) => kyc === 'Vérifié' ? 'kyc-verified' : kyc === 'En attente' ? 'kyc-pending' : kyc === 'Rejeté' ? 'kyc-rejected' : 'kyc-na';

    const render = () => {
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / perPage));
      currentPage = Math.min(currentPage, pages);
      const start = (currentPage - 1) * perPage;
      const rows = filtered.slice(start, start + perPage);
      tbody.innerHTML = rows.map((u: any) => `
        <tr data-id="${u.id}">
          <td><input class="row-check" type="checkbox"></td>
          <td>${String(u.id).padStart(3, '0')}</td>
          <td><div class="user-cell"><span class="user-avatar ${u.role.toLowerCase()}">${initials(u.nom)}</span><div><div class="user-name">${u.nom}</div><div class="user-email">${u.email}</div>${u.job ? `<span class="job-mini">${u.job}</span>` : ''}</div></div></td>
          <td><span class="pill ${roleClass(u.role)}">${u.role}</span></td>
          <td><span class="pill ${kycClass(u.kyc)}"><span class="dot"></span>${u.kyc}</span></td>
          <td>${u.abo === 'Pro' ? `<span class="pill pro-badge">⭐ Pro</span>` : `<span class="muted">Gratuit</span>`}</td>
          <td class="muted">📍 ${u.ville}</td>
          <td>${u.date}</td>
          <td><span class="recent">${u.recent ? `<span class="online-dot"></span>` : ''}${u.last}</span></td>
          <td>${u.note === 'N/A' ? `<span class="muted">N/A</span>` : `<span class="stars">★</span> ${u.note}/5 <span class="muted">(${u.avis})</span>`}</td>
          <td><div class="actions">
            <button class="action-btn view-btn" data-view="${u.id}" title="Voir profil">👁</button>
            <button class="action-btn edit-btn" data-edit="${u.id}" title="Modifier">✏️</button>
            <button class="action-btn more-btn" data-more type="button">⋮</button>
            <div class="dropdown">
              <button style="color:var(--bleu)">🛡 Vérifier KYC</button>
              <button style="color:var(--orange)">⭐ Passer en Pro</button>
              <button data-danger="Suspendre ${u.nom}" style="color:var(--jaune)">⏸ Suspendre</button>
              <button data-danger="Bannir ${u.nom}" style="color:var(--rouge)">🚫 Bannir</button>
              <button data-danger="Supprimer ${u.nom}" style="color:var(--rouge);font-weight:900">🗑 Supprimer</button>
            </div>
          </div></td>
        </tr>`).join('');
      resultBadge.textContent = `${total} utilisateur${total > 1 ? 's' : ''}`;
      pageInfo.textContent = total ? `Affichage de ${start + 1} à ${Math.min(start + perPage, total)} sur ${tableData.length} utilisateurs` : 'Aucun utilisateur trouvé';
      renderPager(pages);
      (document.getElementById('selectAll') as HTMLInputElement).checked = false;
      updateBulk();
    };

    const renderPager = (pages: number) => {
      const items = [`<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← Précédent</button>`];
      [1,2,3].forEach(p => { if (p <= pages) items.push(`<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`); });
      if (pages > 4) items.push(`<span>...</span><button class="page-btn ${pages === currentPage ? 'active' : ''}" data-page="${pages}">${pages}</button>`);
      items.push(`<button class="page-btn" ${currentPage === pages ? 'disabled' : ''} data-page="${currentPage + 1}">Suivant →</button>`);
      pager.innerHTML = items.join('');
    };

    const applyFilters = () => {
      const q = searchInput.value.toLowerCase();
      filtered = tableData.filter((u: any) => {
        const text = Object.values(u).join(' ').toLowerCase();
        return (!q || text.includes(q)) &&
          (!roleFilter.value || u.role === roleFilter.value) &&
          (!kycFilter.value || u.kyc === kycFilter.value) &&
          (!aboFilter.value || u.abo === aboFilter.value);
      });
      if (sortKey) sortData();
      currentPage = 1;
      render();
    };

    const sortData = () => {
      filtered.sort((a: any, b: any) => {
        let av = a[sortKey], bv = b[sortKey];
        if (sortKey === 'note') { av = av === 'N/A' ? 0 : parseFloat(av); bv = bv === 'N/A' ? 0 : parseFloat(bv); }
        if (sortKey === 'id') return (av - bv) * sortDir;
        return String(av).localeCompare(String(bv), 'fr') * sortDir;
      });
    };

    const updateBulk = () => {
      const count = document.querySelectorAll('.row-check:checked').length;
      bulkBar.classList.toggle('active', count > 0);
      bulkCount.textContent = `${count} utilisateur${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;
    };

    const openModal = (id: string) => {
      document.getElementById('overlay')?.classList.add('active');
      document.getElementById(id)?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeModals = () => {
      document.querySelectorAll('.modal,.overlay').forEach(el => el.classList.remove('active'));
      document.body.style.overflow = '';
    };

    const showProfile = (id: string) => {
      const u = tableData.find((item: any) => item.id === Number(id));
      if (!u) return;
      document.getElementById('profileBody')!.innerHTML = `
        <div class="profile-layout">
          <aside class="profile-side">
            <div class="big-avatar">${initials(u.nom)}</div>
            <h3>${u.nom}</h3>
            <div class="muted">${u.email}</div>
            <div style="display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin:12px 0">
              <span class="pill ${roleClass(u.role)}">${u.role}</span><span class="pill ${kycClass(u.kyc)}"><span class="dot"></span>${u.kyc}</span>
            </div>
            ${u.note !== 'N/A' ? `<div><span class="stars">★★★★★</span> ${u.note}/5</div>` : ''}
            <div class="quick-list">
              <span>📍 ${u.ville}</span><span>📅 Inscrit le ${u.date}</span><span>🕐 ${u.last}</span><span>💳 ${u.abo}</span>
            </div>
          </aside>
          <section>
            <div class="tabs">
              <button class="tab-btn active" data-tab="info">Informations</button>
              <button class="tab-btn" data-tab="ads">Annonces</button>
              <button class="tab-btn" data-tab="reviews">Avis</button>
              <button class="tab-btn" data-tab="activity">Activité</button>
            </div>
            <div class="tab-panel active" id="tab-info">
              <div class="info-grid">
                <div class="info-box"><small>ID Utilisateur</small>USR-${String(u.id).padStart(5,'0')}</div>
                <div class="info-box"><small>Email</small>${u.email}</div>
                <div class="info-box"><small>Rôle</small><span class="pill ${roleClass(u.role)}">${u.role}</span></div>
                <div class="info-box"><small>Statut KYC</small><span class="pill ${kycClass(u.kyc)}">${u.kyc}</span></div>
                <div class="info-box"><small>Abonnement</small>${u.abo}</div>
                <div class="info-box"><small>Inscription</small>${u.date}</div>
              </div>
            </div>
            <div class="tab-panel" id="tab-ads"><div class="mini-list"><div class="mini-item">Cherche plombier · <span class="pill kyc-verified">Active</span></div></div></div>
            <div class="tab-panel" id="tab-reviews"><div class="mini-list"><div class="mini-item"><span class="stars">★★★★★</span> Très professionnel.</div></div></div>
            <div class="tab-panel" id="tab-activity"><div class="timeline"><div class="timeline-item"><span class="online-dot"></span><div>Connexion · ${u.last}</div></div></div></div>
          </section>
        </div>`;
      openModal('profileModal');
    };

    const showEdit = (id: string) => {
      const u = tableData.find((item: any) => item.id === Number(id));
      if (!u) return;
      const [prenom, ...restNom] = u.nom.split(' ');
      const nom = restNom.join(' ');
      (document.getElementById('edit-prenom') as HTMLInputElement).value = prenom || '';
      (document.getElementById('edit-nom') as HTMLInputElement).value = nom || '';
      (document.getElementById('edit-email') as HTMLInputElement).value = u.email || '';
      (document.getElementById('edit-ville') as HTMLInputElement).value = u.ville === '—' ? '' : u.ville;
      const roleSelect = document.getElementById('edit-role') as HTMLSelectElement;
      if (roleSelect) roleSelect.value = u.role;
      const kycSelect = document.getElementById('edit-kyc') as HTMLSelectElement;
      if (kycSelect) kycSelect.value = u.kyc;
      const editForm = document.getElementById('editForm');
      if (editForm) editForm.dataset['userId'] = String(u.id);
      openModal('editModal');
    };

    const exportCSV = () => {
      const headers = ['ID','Nom','Email','Rôle','KYC','Abonnement','Ville','Inscrit'];
      const rows = tableData.map((u: any) => [u.id, u.nom, u.email, u.role, u.kyc, u.abo, u.ville, u.date]);
      const csv = [headers, ...rows].map((r: any[]) => r.map((v: any) => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'bricoleup_users.csv'; a.click();
      URL.revokeObjectURL(url);
    };

    const refreshUsers = () => {
      const token = this.authService.getAccessToken();
      this.http.get<any[]>(`${environment.apiUrl}/auth/admin/users/`, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
        next: (users) => { tableData.length = 0; tableData.push(...this.mapUsers(users)); applyFilters(); },
        error: (err) => alert(err?.error?.error || 'Erreur lors du rechargement des utilisateurs.'),
      });
    };

    const runAdminAction = (userId: string, action: string, userName: string) => {
      const token = this.authService.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const labels: Record<string, string> = {
        verify_kyc: 'verifier le KYC',
        make_pro: 'passer en Pro',
        suspend: 'suspendre',
        ban: 'bannir',
        delete: 'supprimer',
      };
      if (['suspend', 'ban', 'delete'].includes(action) && !confirm(`Confirmer: ${labels[action]} ${userName} ?`)) return;
      const request = action === 'delete'
        ? this.http.delete<any>(`${environment.apiUrl}/auth/users/${userId}/`, { headers })
        : this.http.patch<any>(`${environment.apiUrl}/auth/users/${userId}/`, { action }, { headers });
      request.subscribe({
        next: refreshUsers,
        error: (err) => alert(err?.error?.error || err?.error?.detail || 'Action impossible.'),
      });
    };

    [searchInput, roleFilter, kycFilter, aboFilter, periodFilter].forEach(el => el?.addEventListener('input', applyFilters));
    document.getElementById('resetBtn')?.addEventListener('click', () => { [searchInput, roleFilter, kycFilter, aboFilter, periodFilter].forEach(el => { if (el) (el as any).value = ''; }); applyFilters(); });
    document.getElementById('perPage')?.addEventListener('change', (e: any) => { perPage = Number(e.target.value); currentPage = 1; render(); });
    document.getElementById('exportBtn')?.addEventListener('click', exportCSV);
    document.getElementById('addUserBtn')?.addEventListener('click', () => openModal('addModal'));
    document.getElementById('hamburger')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('open'));
    document.getElementById('notifBtn')?.addEventListener('click', (e: any) => { e.stopPropagation(); document.getElementById('notifMenu')?.classList.toggle('active'); });

    document.addEventListener('click', (e: any) => {
      if (!e.target.closest('.actions')) document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
      if (!e.target.closest('.notification-menu') && !e.target.closest('#notifBtn')) document.getElementById('notifMenu')?.classList.remove('active');
    });

    document.addEventListener('click', (e: any) => {
      const page = e.target.closest('[data-page]');
      if (page) { currentPage = Number(page.dataset.page); render(); }
      const sort = e.target.closest('th.sortable');
      if (sort) { sortDir = sortKey === sort.dataset.sort ? sortDir * -1 : 1; sortKey = sort.dataset.sort; sortData(); render(); }
      const more = e.target.closest('[data-more]');
      if (more) { e.stopPropagation(); more.nextElementSibling?.classList.toggle('active'); }
      const view = e.target.closest('[data-view]');
      if (view) showProfile(view.dataset.view);
      const edit = e.target.closest('[data-edit]');
      if (edit) showEdit(edit.dataset.edit);
      const dropdownButton = e.target.closest('.dropdown button');
      if (dropdownButton) {
        const row = dropdownButton.closest('tr');
        const userId = row?.dataset?.id;
        const user = tableData.find((item: any) => item.id === Number(userId));
        const label = String(dropdownButton.textContent || '');
        const action = label.includes('KYC') ? 'verify_kyc'
          : label.includes('Pro') ? 'make_pro'
          : label.includes('Suspendre') ? 'suspend'
          : label.includes('Bannir') ? 'ban'
          : label.includes('Supprimer') ? 'delete'
          : '';
        if (userId && action) {
          e.preventDefault();
          e.stopPropagation();
          runAdminAction(userId, action, user?.nom || 'cet utilisateur');
          return;
        }
      }
      const danger = e.target.closest('[data-danger]');
      if (danger) { const ct = document.getElementById('confirmText'); if (ct) ct.textContent = `Êtes-vous sûr de vouloir ${danger.dataset.danger} ?`; openModal('confirmModal'); }
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        document.querySelectorAll('.tab-btn,.tab-panel').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
      }
    });

    document.getElementById('selectAll')?.addEventListener('change', (e: any) => {
      document.querySelectorAll('.row-check').forEach((cb: any) => cb.checked = e.target.checked);
      updateBulk();
    });
    tbody.addEventListener('change', (e: any) => { if (e.target.classList.contains('row-check')) updateBulk(); });
    document.getElementById('clearSelection')?.addEventListener('click', () => { document.querySelectorAll('.row-check,#selectAll').forEach((cb: any) => cb.checked = false); updateBulk(); });
    document.querySelectorAll('.modal-close,#overlay').forEach(el => el.addEventListener('click', closeModals));
    document.addEventListener('keydown', (e: any) => { if (e.key === 'Escape') closeModals(); });
    document.querySelectorAll("input[name='roleNew']").forEach(r => r.addEventListener('change', () => document.getElementById('providerExtra')?.classList.toggle('active', (r as HTMLInputElement).value === 'Prestataire' && (r as HTMLInputElement).checked)));
    (document.getElementById('kmRange') as HTMLInputElement)?.addEventListener('input', (e: any) => { const kv = document.getElementById('kmValue'); if (kv) kv.textContent = e.target.value; });
    document.getElementById('addForm')?.addEventListener('submit', (e: any) => { e.preventDefault(); closeModals(); });

    document.getElementById('editForm')?.addEventListener('submit', (e: any) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const userId = form.dataset['userId'];
      const token = this.authService.getAccessToken();
      const body = {
        prenom: (document.getElementById('edit-prenom') as HTMLInputElement).value.trim(),
        nom: (document.getElementById('edit-nom') as HTMLInputElement).value.trim(),
        email: (document.getElementById('edit-email') as HTMLInputElement).value.trim(),
        localisation: (document.getElementById('edit-ville') as HTMLInputElement).value.trim(),
        role: (document.getElementById('edit-role') as HTMLSelectElement).value,
        kyc_status: (document.getElementById('edit-kyc') as HTMLSelectElement).value === 'Vérifié' ? 'verified'
          : (document.getElementById('edit-kyc') as HTMLSelectElement).value === 'En attente' ? 'pending'
          : (document.getElementById('edit-kyc') as HTMLSelectElement).value === 'Rejeté' ? 'rejected' : 'none',
      };
      this.http.patch<any>(
        `${environment.apiUrl}/auth/users/${userId}/`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      ).subscribe({
        next: () => {
          closeModals();
          this.http.get<any[]>(`${environment.apiUrl}/auth/admin/users/`, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
            next: (users) => { tableData.length = 0; tableData.push(...this.mapUsers(users)); applyFilters(); }
          });
        },
        error: (err) => { alert(err?.error?.detail || 'Erreur lors de la modification.'); }
      });
    });

    render();
  } // fin initTable
} // fin AdminComponent
