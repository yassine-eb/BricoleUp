import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  signal, ViewChild, ElementRef, ViewEncapsulation, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { WebSocketService } from '../../core/services/websocket.service';
import { ActivatedRoute, Router } from '@angular/router';

interface Conv {
  id: number;
  slug: string;          // slug du partenaire → utilisé pour /conversations/<slug>/
  name: string;
  init: string;
  color: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  avatar: string | null;
}

interface Msg {
  id: number;
  body: string;
  mine: boolean;
  time: string;
  timestamp: string;
}

const COLORS = ['#1B3C6B','#EA580C','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }

    .msg-page {
      display:flex; height:100vh;
      max-width:1080px; margin:0 auto;
      background:#F8FAFC;
      font-family:'DM Sans',sans-serif;
    }

    /* ── SIDEBAR ── */
    .msg-left {
      width:320px; flex-shrink:0; background:#fff;
      border-right:1px solid #E2E8F0;
      display:flex; flex-direction:column; height:100%;
    }
    .msg-left-head { padding:20px 16px 0; }
    .msg-left-title {
      font-family:'Poppins',sans-serif; font-size:1.15rem;
      font-weight:800; color:#0F172A; margin-bottom:14px;
    }
    .msg-search-wrap { position:relative; margin-bottom:12px; }
    .msg-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94A3B8; pointer-events:none; }
    .msg-search {
      width:100%; border:none; border-radius:10px;
      background:#F1F5F9; padding:10px 14px 10px 36px;
      font-size:.85rem; color:#0F172A; outline:none; font-family:inherit;
    }
    .msg-search::placeholder { color:#94A3B8; }
    .msg-tabs { display:flex; gap:4px; margin-bottom:4px; }
    .msg-tab {
      flex:1; border:none; background:transparent; padding:8px 10px;
      font-size:.78rem; font-weight:700; color:#64748B;
      cursor:pointer; border-radius:8px; font-family:inherit; transition:all .15s;
    }
    .msg-tab.active { background:#EFF6FF; color:#1B3C6B; }
    .msg-tab:hover:not(.active) { background:#F8FAFC; }

    .conv-list { flex:1; overflow-y:auto; padding:8px 0; }
    .conv-list::-webkit-scrollbar { width:4px; }
    .conv-list::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:4px; }

    .conv-loading {
      display:flex; align-items:center; gap:10px;
      padding:24px 16px; color:#94A3B8; font-size:.85rem;
    }
    .spin {
      width:16px; height:16px; border:2px solid #E2E8F0;
      border-top-color:#1B3C6B; border-radius:50%;
      animation:spin .7s linear infinite; flex-shrink:0;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    .conv-empty {
      display:flex; flex-direction:column; align-items:center;
      padding:48px 20px; text-align:center; color:#94A3B8; gap:10px;
    }
    .conv-empty p { font-size:.88rem; }

    .conv-item {
      display:flex; align-items:center; gap:12px;
      padding:12px 16px; cursor:pointer; border-radius:12px;
      margin:2px 8px; transition:background .15s;
    }
    .conv-item:hover { background:#F8FAFC; }
    .conv-item.active { background:#EFF6FF; }

    .conv-av-wrap { position:relative; flex-shrink:0; }
    .conv-av {
      width:46px; height:46px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:800; font-size:.9rem; overflow:hidden;
    }
    .conv-av img { width:100%; height:100%; object-fit:cover; }
    .unread-dot {
      position:absolute; top:-2px; right:-2px;
      min-width:18px; height:18px; background:#F97316;
      color:#fff; border-radius:50px; font-size:.6rem; font-weight:800;
      display:flex; align-items:center; justify-content:center;
      padding:0 4px; border:2px solid #fff;
    }
    .conv-info { flex:1; min-width:0; }
    .conv-name { font-weight:700; font-size:.88rem; color:#0F172A; margin-bottom:3px; }
    .conv-last {
      font-size:.78rem; color:#94A3B8;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .conv-time-col { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0; }
    .conv-time { font-size:.68rem; color:#94A3B8; white-space:nowrap; }
    .conv-unread-badge {
      background:#F97316; color:#fff; border-radius:50px;
      font-size:.6rem; font-weight:800; padding:2px 6px; min-width:18px;
      text-align:center;
    }

    /* ── ZONE CHAT ── */
    .msg-right {
      flex:1; display:flex; flex-direction:column;
      height:100%; overflow:hidden; background:#F8FAFC;
    }

    .chat-back-btn {
      display:none; width:32px; height:32px; border-radius:50%;
      border:none; background:#F1F5F9; color:#1B3C6B;
      align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;
    }
    @media(max-width:768px) { .chat-back-btn { display:flex; } }

    .chat-head {
      background:#fff; border-bottom:1px solid #E2E8F0;
      padding:12px 20px; display:flex; align-items:center;
      gap:12px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,.04);
    }
    .chat-av {
      width:42px; height:42px; border-radius:50%; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:800; font-size:.9rem; flex-shrink:0;
    }
    .chat-av img { width:100%; height:100%; object-fit:cover; }
    .chat-head-info { flex:1; min-width:0; }
    .chat-name { font-weight:700; font-size:.95rem; color:#0F172A; }
    .chat-status { font-size:.75rem; color:#94A3B8; margin-top:1px; }
    .chat-head-right { display:flex; align-items:center; gap:6px; }
    .chat-head-btn {
      width:36px; height:36px; border-radius:10px; border:1px solid #E2E8F0;
      background:#fff; display:flex; align-items:center; justify-content:center;
      color:#64748B; cursor:pointer; transition:all .15s;
    }
    .chat-head-btn:hover { background:#EFF6FF; color:#1B3C6B; border-color:#1B3C6B; }

    /* Messages */
    .chat-messages {
      flex:1; overflow-y:auto; padding:20px 24px;
      display:flex; flex-direction:column; gap:6px;
    }
    .chat-messages::-webkit-scrollbar { width:4px; }
    .chat-messages::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:4px; }

    .date-sep {
      align-self:center; background:#E2E8F0; border-radius:50px;
      padding:4px 14px; font-size:.7rem; color:#64748B; margin:10px 0 4px;
    }

    .msg-recv { display:flex; align-items:flex-end; gap:8px; max-width:72%; }
    .msg-send { display:flex; justify-content:flex-end; max-width:72%; align-self:flex-end; }

    .msg-av-sm {
      width:30px; height:30px; border-radius:50%; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:800; font-size:.65rem; flex-shrink:0;
    }
    .msg-av-sm img { width:100%; height:100%; object-fit:cover; }

    .bub-recv {
      background:#fff; border-radius:4px 18px 18px 18px;
      padding:10px 14px; box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .bub-send {
      background:linear-gradient(135deg,#1B3C6B,#2a5298); color:#fff;
      border-radius:18px 4px 18px 18px; padding:10px 14px;
    }
    .msg-text { font-size:.88rem; line-height:1.55; word-break:break-word; }
    .msg-time-recv { font-size:.65rem; color:#94A3B8; margin-top:3px; padding-left:2px; }
    .msg-time-send { font-size:.65rem; color:rgba(255,255,255,.6); margin-top:3px; text-align:right; padding-right:2px; }

    .typing-bub { display:flex; align-items:flex-end; gap:8px; }
    .typing-dots { display:flex; gap:5px; padding:13px 18px; background:#fff; border-radius:4px 18px 18px 18px; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .typing-dots span { width:7px; height:7px; border-radius:50%; background:#94A3B8; animation:bounce .9s infinite; }
    .typing-dots span:nth-child(2) { animation-delay:.18s; }
    .typing-dots span:nth-child(3) { animation-delay:.36s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    /* Saisie */
    .chat-input-area {
      background:#fff; border-top:1px solid #E2E8F0;
      padding:12px 16px; display:flex; align-items:flex-end;
      gap:8px; flex-shrink:0;
    }
    .chat-textarea {
      flex:1; border:1.5px solid #E2E8F0; border-radius:22px;
      padding:10px 18px; font-size:.9rem; color:#0F172A;
      outline:none; resize:none; max-height:120px; overflow-y:hidden;
      line-height:1.5; font-family:inherit; background:#F8FAFC;
      transition:border-color .2s, background .2s;
    }
    .chat-textarea:focus { border-color:#1B3C6B; background:#fff; }
    .chat-textarea::placeholder { color:#94A3B8; }
    .send-btn {
      width:44px; height:44px; border-radius:50%; border:none;
      background:#E2E8F0; color:#94A3B8; display:flex;
      align-items:center; justify-content:center; flex-shrink:0;
      cursor:pointer; transition:all .2s;
    }
    .send-btn.active { background:linear-gradient(135deg,#1B3C6B,#2a5298); color:#fff; box-shadow:0 4px 12px rgba(27,60,107,.3); }
    .send-btn.active:hover { transform:scale(1.08); }

    /* Vide */
    .chat-empty {
      flex:1; display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      color:#94A3B8; text-align:center; padding:40px; gap:12px;
    }
    .chat-empty-icon { width:72px; height:72px; border-radius:50%; background:#EFF6FF; display:flex; align-items:center; justify-content:center; }
    .chat-empty h3 { font-family:'Poppins',sans-serif; font-size:1rem; font-weight:700; color:#1B3C6B; }
    .chat-empty p { font-size:.84rem; max-width:240px; }

    .msg-error {
      background:#FEF2F2; color:#EF4444; border:1px solid #FECACA;
      border-radius:10px; padding:10px 14px; font-size:.82rem;
      font-weight:600; margin:8px 16px; text-align:center;
    }

    @media(max-width:768px) {
      .msg-page { max-width:100%; }
      .msg-left { width:100%; }
      .msg-left.conv-open { display:none; }
      .msg-right { display:none; }
      .msg-right.conv-open { display:flex; }
    }
  `],
  template: `
    <div class="msg-page">

      <!-- ── SIDEBAR conversations ── -->
      <div class="msg-left" [class.conv-open]="!!activeConv()">
        <div class="msg-left-head">
          <div class="msg-left-title">Messages</div>
          <div class="msg-search-wrap">
            <svg class="msg-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="msg-search" type="search" placeholder="Rechercher…" [(ngModel)]="searchQ" (input)="filterConvs()">
          </div>
          <div class="msg-tabs">
            <button class="msg-tab" [class.active]="tab==='all'" (click)="tab='all'; filterConvs()">Tous</button>
            <button class="msg-tab" [class.active]="tab==='unread'" (click)="tab='unread'; filterConvs()">
              Non lus{{ totalUnread() > 0 ? ' · ' + totalUnread() : '' }}
            </button>
          </div>
        </div>

        <div class="conv-list">
          @if (loadingConvs()) {
            <div class="conv-loading"><div class="spin"></div> Chargement…</div>
          } @else if (filteredConvs().length === 0) {
            <div class="conv-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>Aucune conversation</p>
            </div>
          } @else {
            @for (c of filteredConvs(); track c.id) {
              <div class="conv-item" [class.active]="activeConv()?.id === c.id" (click)="openConv(c)">
                <div class="conv-av-wrap" (click)="goToProfile(c, $event)" title="Voir le profil">
                  <div class="conv-av" [style.background]="c.color">
                    @if (c.avatar) { <img [src]="c.avatar" [alt]="c.name"> }
                    @else { {{ c.init }} }
                  </div>
                </div>
                <div class="conv-info">
                  <div class="conv-name">{{ c.name }}</div>
                  <div class="conv-last">{{ c.lastMsg }}</div>
                </div>
                <div class="conv-time-col">
                  <span class="conv-time">{{ c.time }}</span>
                  @if (c.unread > 0) { <span class="conv-unread-badge">{{ c.unread }}</span> }
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- ── ZONE CHAT ── -->
      <div class="msg-right" [class.conv-open]="!!activeConv()">

        @if (activeConv(); as conv) {

          <div class="chat-head">
            <button class="chat-back-btn" (click)="activeConv.set(null)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="chat-av" [style.background]="conv.color">
              @if (conv.avatar) { <img [src]="conv.avatar" [alt]="conv.name"> }
              @else { {{ conv.init }} }
            </div>
            <div class="chat-head-info">
              <div class="chat-name">{{ conv.name }}</div>
              <div class="chat-status">Prestataire</div>
            </div>
            <div class="chat-head-right">
              <button class="chat-head-btn" (click)="goToProfile(conv, $event)" title="Voir le profil">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
            </div>
          </div>

          @if (msgError()) {
            <div class="msg-error">{{ msgError() }}</div>
          }

          <div class="chat-messages" #msgContainer>
            @if (loadingMsgs()) {
              <div style="align-self:center;padding:24px;color:#94A3B8;font-size:.85rem;display:flex;gap:8px;align-items:center">
                <div class="spin"></div> Chargement…
              </div>
            } @else {
              <div class="date-sep">Aujourd'hui</div>

              @for (msg of activeMessages(); track msg.id) {
                @if (msg.mine) {
                  <div class="msg-send">
                    <div>
                      <div class="bub-send"><div class="msg-text">{{ msg.body }}</div></div>
                      <div class="msg-time-send">{{ msg.time }} ✓✓</div>
                    </div>
                  </div>
                } @else {
                  <div class="msg-recv">
                    <div class="msg-av-sm" [style.background]="conv.color">
                      @if (conv.avatar) { <img [src]="conv.avatar" [alt]="conv.init"> }
                      @else { {{ conv.init }} }
                    </div>
                    <div>
                      <div class="bub-recv"><div class="msg-text">{{ msg.body }}</div></div>
                      <div class="msg-time-recv">{{ msg.time }}</div>
                    </div>
                  </div>
                }
              }

              @if (isTyping()) {
                <div class="typing-bub">
                  <div class="msg-av-sm" [style.background]="conv.color">{{ conv.init }}</div>
                  <div class="typing-dots"><span></span><span></span><span></span></div>
                </div>
              }
            }
          </div>

          <div class="chat-input-area">
            <textarea
              class="chat-textarea"
              #chatTA
              rows="1"
              placeholder="Écrire un message…"
              [(ngModel)]="inputText"
              (input)="onInput(chatTA)"
              (keydown.enter)="onEnter($event, chatTA)"
            ></textarea>
            <button class="send-btn" [class.active]="inputText.trim().length > 0" (click)="sendMsg()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

        } @else {
          <div class="chat-empty">
            <div class="chat-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1B3C6B" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>Vos messages</h3>
            <p>Sélectionnez une conversation pour commencer à échanger.</p>
          </div>
        }

      </div>
    </div>
  `,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('msgContainer') msgContainer!: ElementRef;

  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private ws      = inject(WebSocketService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private destroy$ = new Subject<void>();

  loadingConvs  = signal(true);
  loadingMsgs   = signal(false);
  msgError      = signal('');
  convs         = signal<Conv[]>([]);
  filteredConvs = signal<Conv[]>([]);
  activeConv    = signal<Conv | null>(null);
  activeMessages = signal<Msg[]>([]);
  isTyping      = signal(false);

  tab      = 'all';
  searchQ  = '';
  inputText = '';
  private needsScroll  = false;
  private msgIdCounter = 9000;

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getAccessToken()}` });
  }

  ngOnInit(): void {
    this.loadConversations();
    this.ws.messages.pipe(takeUntil(this.destroy$)).subscribe((msg: any) => {
      if (msg.type === 'message.new' || msg.type === 'chat_message') {
        const me = this.auth.currentUser$();
        if (msg.sender_id !== me?.id) {
          this.activeMessages.update(l => [...l, {
            id: msg.message_id || this.msgIdCounter++,
            body: msg.contenu || msg.body || '',
            mine: false,
            time: this.toTime(msg.sent_at || new Date().toISOString()),
            timestamp: msg.sent_at || '',
          }]);
          this.needsScroll = true;
        }
      }
      if (msg.type === 'typing') this.isTyping.set(msg.is_typing ?? false);
    });
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll && this.msgContainer) {
      const el = this.msgContainer.nativeElement as HTMLElement;
      el.scrollTop = el.scrollHeight;
      this.needsScroll = false;
    }
  }

  // Récupère l'ID numérique depuis le token JWT
  private getMyId(): number {
    try {
      const token = this.auth.getAccessToken();
      if (!token) return -1;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id || -1;
    } catch { return -1; }
  }

  // Résout l'URL avatar (relative → absolue)
  private resolveAvatar(url: string | null): string | null {
    if (!url) return null;
    if (url.includes('defaultprofile')) return null;
    if (url.startsWith('http')) return url;
    const base = environment.apiUrl.replace(/\/api.*/, '');
    return `${base}${url}`;
  }

  private msgCache = new Map<string, Msg[]>();

  private loadConversations(): void {
    this.loadingConvs.set(true);

    // Affichage immédiat depuis cache localStorage
    const cached = localStorage.getItem('bu_convs');
    if (cached) {
      try {
        const mapped = JSON.parse(cached) as Conv[];
        this.convs.set(mapped);
        this.filteredConvs.set(mapped);
        this.loadingConvs.set(false);
      } catch {}
    }

    this.http.get<any[]>(`${environment.apiUrl}/conversations/`, { headers: this.headers }).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        const mapped: Conv[] = list.map((c: any, i: number) => ({
          id: c.id,
          slug: c.partner?.slug || '',
          name: c.partner?.username || 'Utilisateur',
          init: (c.partner?.username || 'U').slice(0, 2).toUpperCase(),
          color: COLORS[i % COLORS.length],
          role: '',
          lastMsg: c.last_message?.body || 'Nouvelle conversation',
          time: c.last_message?.timestamp ? this.timeAgo(c.last_message.timestamp) : '',
          unread: c.unread_count || 0,
          online: false,
          avatar: this.resolveAvatar(c.partner?.avatar),
        }));
        this.convs.set(mapped);
        this.filteredConvs.set(mapped);
        this.loadingConvs.set(false);
        localStorage.setItem('bu_convs', JSON.stringify(mapped));

        // Ouvre directement la conv si ?slug= dans l'URL
        const targetSlug = this.route.snapshot.queryParamMap.get('slug');
        if (targetSlug) {
          const found = mapped.find(c => c.slug === targetSlug);
          if (found) {
            this.openConv(found);
          } else {
            // Crée une nouvelle conv avec ce slug
            const newConv: Conv = {
              id: 0, slug: targetSlug,
              name: targetSlug, init: targetSlug.slice(0, 2).toUpperCase(),
              color: COLORS[0], role: '', lastMsg: '', time: '', unread: 0, online: false, avatar: null,
            };
            this.convs.update(l => [newConv, ...l]);
            this.filteredConvs.update(l => [newConv, ...l]);
            this.openConv(newConv);
          }
        } else if (mapped.length > 0 && !this.activeConv()) {
          this.openConv(mapped[0]);
        }
      },
      error: () => { this.loadingConvs.set(false); },
    });
  }

  openConv(c: Conv): void {
    if (!c.slug) return;
    this.activeConv.set(c);
    c.unread = 0;
    this.convs.update(l => [...l]);
    this.filteredConvs.update(l => [...l]);
    this.msgError.set('');

    // Affichage immédiat depuis cache mémoire
    if (this.msgCache.has(c.slug)) {
      this.activeMessages.set(this.msgCache.get(c.slug)!);
      this.needsScroll = true;
      this.loadingMsgs.set(false);
    } else {
      this.loadingMsgs.set(true);
      this.activeMessages.set([]);
    }

    const currentUser = this.auth.currentUser$();
    const myId = currentUser?.id ?? this.getMyId();
    console.log('myId:', myId, 'currentUser:', currentUser?.id);

    this.http.get<any>(`${environment.apiUrl}/conversations/${c.slug}/`, { headers: this.headers }).subscribe({
      next: (res) => {
        const msgs: Msg[] = (res.messages || []).map((m: any) => ({
          id: m.id,
          body: m.body,
          mine: (m.is_mine === true) || (Number(m.sender) === myId),
          time: this.toTime(m.timestamp),
          timestamp: m.timestamp,
        }));
        this.msgCache.set(c.slug, msgs);
        this.activeMessages.set(msgs);
        this.loadingMsgs.set(false);
        this.needsScroll = true;
        if (res.recipient) {
          c.name   = res.recipient.username || c.name;
          c.init   = c.name.slice(0, 2).toUpperCase();
          c.avatar = this.resolveAvatar(res.recipient.avatar);
          this.activeConv.set({ ...c });
        }
        try { this.ws.disconnect(); this.ws.connect(c.id); } catch {}
      },
      error: () => { this.loadingMsgs.set(false); },
    });
  }

  filterConvs(): void {
    let list = this.convs();
    if (this.searchQ.trim()) {
      const q = this.searchQ.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.lastMsg.toLowerCase().includes(q));
    }
    if (this.tab === 'unread') list = list.filter(c => c.unread > 0);
    this.filteredConvs.set(list);
  }

  totalUnread(): number { return this.convs().reduce((s, c) => s + c.unread, 0); }

  onInput(ta: HTMLTextAreaElement): void {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  onEnter(e: Event, ta: HTMLTextAreaElement): void {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { ke.preventDefault(); this.sendMsg(); }
  }

  sendMsg(): void {
    const body = this.inputText.trim();
    const conv = this.activeConv();
    if (!body || !conv?.slug) return;

    const tempId = this.msgIdCounter++;
    const now = new Date().toISOString();
    const newMsg: Msg = { id: tempId, body, mine: true, time: this.toTime(now), timestamp: now };
    this.activeMessages.update(l => [...l, newMsg]);
    this.msgCache.set(conv.slug, this.activeMessages());
    this.inputText = '';
    this.needsScroll = true;
    conv.lastMsg = body;
    conv.time = 'À l\'instant';
    this.convs.update(l => [...l]);
    this.filteredConvs.update(l => [...l]);

    this.http.post<any>(
      `${environment.apiUrl}/conversations/${conv.slug}/`,
      { body },
      { headers: this.headers }
    ).subscribe({
      next: () => {},
      error: (err) => {
        // Annuler le message optimiste
        this.activeMessages.update(l => l.filter(m => m.id !== tempId));
        this.msgError.set(err?.error?.detail || 'Erreur lors de l\'envoi. Réessayez.');
        setTimeout(() => this.msgError.set(''), 4000);
      },
    });

    try { this.ws.send({ type: 'message.send', contenu: body }); } catch {}
  }

  private toTime(ts: string): string {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }

  private timeAgo(ts: string): string {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'hier';
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  goToProfile(c: Conv, e: Event): void {
    e.stopPropagation();
    if (c.slug) this.router.navigate(['/profil', c.slug]);
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    try { this.ws.disconnect(); } catch {}
  }
}
