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
    :root {
      --bleu:#1B3C6B; --bleu-dark:#132d52; --bleu-light:#EFF6FF;
      --orange:#F97316; --orange-light:#FFF7ED;
      --vert:#22C55E; --vert-light:#F0FDF4;
      --rouge:#EF4444; --rouge-light:#FEF2F2;
      --gris:#64748B; --gris-light:#F8FAFC;
      --border:#E2E8F0; --texte:#0F172A;
    }
    * { box-sizing: border-box; }

    .msg-page {
      display: flex;
      height: calc(100vh - 64px);
      max-width: 1100px;
      margin: 0 auto;
      overflow: hidden;
      background: #fff;
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
    }

    /* ── COLONNE GAUCHE ── */
    .msg-left {
      width: 340px; flex-shrink: 0;
      background: #fff; border-right: 1px solid var(--border);
      display: flex; flex-direction: column; height: 100%;
    }
    .msg-left-head { padding: 18px 16px 0; flex-shrink: 0; }
    .msg-left-title {
      font-family:"Poppins",sans-serif; font-size:1.2rem;
      font-weight:700; color:var(--bleu); margin-bottom:12px;
    }
    .msg-search-wrap { position:relative; margin-bottom:10px; }
    .msg-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--gris); }
    .msg-search {
      width:100%; border:none; border-radius:50px;
      background:var(--gris-light); padding:9px 16px 9px 36px;
      font-size:.85rem; color:var(--texte); outline:none; font-family:inherit;
    }
    .msg-tabs { display:flex; border-bottom:1px solid var(--border); }
    .msg-tab {
      border:none; background:transparent; padding:9px 14px;
      font-size:.78rem; font-weight:600; color:var(--gris);
      cursor:pointer; border-bottom:2px solid transparent;
      white-space:nowrap; font-family:inherit; transition:color .15s;
    }
    .msg-tab.active { color:var(--bleu); border-bottom-color:var(--orange); }
    .msg-tab:hover:not(.active) { color:var(--bleu); }

    .conv-list { flex:1; overflow-y:auto; }

    .conv-loading {
      display:flex; align-items:center; gap:10px;
      padding:24px 16px; color:var(--gris); font-size:.85rem;
    }
    .spin {
      width:18px; height:18px; border:2px solid var(--border);
      border-top-color:var(--bleu); border-radius:50%;
      animation:spin .7s linear infinite; flex-shrink:0;
    }
    @keyframes spin { to { transform:rotate(360deg); } }

    .conv-empty {
      display:flex; flex-direction:column; align-items:center;
      padding:48px 20px; text-align:center; color:var(--gris);
    }
    .conv-empty p { font-size:.9rem; margin-top:10px; }

    .conv-item {
      display:flex; align-items:flex-start; gap:10px;
      padding:14px 16px; cursor:pointer;
      border-left:3px solid transparent; transition:background .15s;
    }
    .conv-item:hover { background:var(--gris-light); }
    .conv-item.active { background:var(--bleu-light); border-left-color:var(--bleu); }
    .conv-item + .conv-item { border-top:1px solid var(--border); }

    .conv-av-wrap { position:relative; flex-shrink:0; }
    .conv-av {
      width:44px; height:44px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:800; font-size:.88rem; overflow:hidden;
    }
    .conv-av img { width:100%; height:100%; object-fit:cover; }
    .unread-dot {
      position:absolute; top:-3px; right:-3px;
      min-width:18px; height:18px; background:var(--orange);
      color:#fff; border-radius:50px; font-size:.6rem; font-weight:800;
      display:flex; align-items:center; justify-content:center;
      padding:0 4px; border:2px solid #fff;
    }
    .conv-info { flex:1; min-width:0; }
    .conv-name-row { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
    .conv-name { font-weight:700; font-size:.88rem; color:var(--texte); }
    .conv-role { font-size:.68rem; font-weight:700; border-radius:50px; padding:1px 7px; background:var(--gris-light); color:var(--gris); }
    .conv-last {
      font-size:.78rem; color:var(--gris);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;
    }
    .conv-meta { display:flex; align-items:center; justify-content:space-between; }
    .conv-time { font-size:.7rem; color:var(--gris); }

    /* ── COLONNE DROITE ── */
    .msg-right {
      flex:1; display:flex; flex-direction:column;
      height:100%; overflow:hidden; background:var(--gris-light);
    }
    .chat-back-btn {
      display: none; width:36px; height:36px; border-radius:50%;
      border:none; background:var(--gris-light); color:var(--bleu);
      align-items:center; justify-content:center; cursor:pointer;
      flex-shrink:0;
    }
    @media(max-width:768px) { .chat-back-btn { display:flex; } }
    .chat-head {
      background:#fff; border-bottom:1px solid var(--border);
      padding:14px 20px; display:flex; align-items:center;
      gap:12px; flex-shrink:0;
    }
    .chat-av {
      width:40px; height:40px; border-radius:50%; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:800; font-size:.9rem; flex-shrink:0;
    }
    .chat-av img { width:100%; height:100%; object-fit:cover; }
    .chat-name { font-family:"Poppins",sans-serif; font-weight:700; font-size:.95rem; color:var(--texte); }
    .chat-status { font-size:.75rem; color:var(--gris); }
    .chat-head-right { margin-left:auto; display:flex; align-items:center; gap:8px; }
    .chat-head-right button {
      border:1px solid var(--border); border-radius:8px;
      padding:6px 12px; background:#fff; font-size:.78rem;
      font-weight:600; color:var(--bleu); cursor:pointer; font-family:inherit;
    }
    .chat-head-right button:hover { background:var(--bleu-light); }
    .chat-more {
      width:34px; height:34px; border-radius:50%; border:1px solid var(--border);
      background:#fff; font-size:1.1rem; display:flex; align-items:center;
      justify-content:center; color:var(--gris); cursor:pointer;
    }

    .chat-messages {
      flex:1; overflow-y:auto; padding:20px;
      display:flex; flex-direction:column; gap:10px;
    }
    .date-sep {
      align-self:center; background:#E2E8F0; border-radius:50px;
      padding:3px 14px; font-size:.72rem; color:var(--gris); margin:8px 0;
    }

    .msg-recv { display:flex; align-items:flex-end; gap:8px; max-width:68%; }
    .msg-send { display:flex; justify-content:flex-end; max-width:68%; align-self:flex-end; }

    .msg-av-sm {
      width:28px; height:28px; border-radius:50%; overflow:hidden;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-weight:800; font-size:.65rem; flex-shrink:0;
    }
    .msg-av-sm img { width:100%; height:100%; object-fit:cover; }

    .bub-recv {
      background:#fff; border-radius:0 16px 16px 16px;
      padding:11px 14px; box-shadow:0 2px 8px rgba(0,0,0,.06);
    }
    .bub-send {
      background:var(--bleu); color:#fff;
      border-radius:16px 0 16px 16px; padding:11px 14px;
    }
    .msg-text { font-size:.88rem; line-height:1.6; }
    .msg-time-recv { font-size:.68rem; color:var(--gris); margin-top:4px; }
    .msg-time-send { font-size:.68rem; color:rgba(255,255,255,.65); margin-top:4px; text-align:right; }

    .typing-bub {
      display:flex; align-items:flex-end; gap:8px; max-width:120px;
    }
    .typing-dots { display:flex; gap:4px; padding:12px 16px; background:#fff; border-radius:0 16px 16px 16px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .typing-dots span { width:7px; height:7px; border-radius:50%; background:var(--gris); animation:bounce .9s infinite; }
    .typing-dots span:nth-child(2) { animation-delay:.2s; }
    .typing-dots span:nth-child(3) { animation-delay:.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* Zone saisie */
    .chat-input-area {
      background:#fff; border-top:1px solid var(--border);
      padding:12px 16px; display:flex; align-items:flex-end;
      gap:10px; flex-shrink:0;
    }
    .attach-btn {
      width:38px; height:38px; border-radius:50%; border:none;
      background:var(--gris-light); color:var(--gris);
      display:flex; align-items:center; justify-content:center;
      font-size:1.1rem; cursor:pointer; flex-shrink:0; transition:background .15s;
    }
    .attach-btn:hover { background:var(--border); }
    .chat-textarea {
      flex:1; border:1.5px solid var(--border); border-radius:20px;
      padding:10px 16px; font-size:.9rem; color:var(--texte);
      outline:none; resize:none; max-height:120px; overflow-y:hidden;
      line-height:1.5; font-family:inherit; background:#fff;
      transition:border-color .2s;
    }
    .chat-textarea:focus { border-color:var(--bleu); }
    .send-btn {
      width:42px; height:42px; border-radius:50%; border:none;
      background:var(--gris-light); color:var(--gris); display:flex;
      align-items:center; justify-content:center; flex-shrink:0;
      cursor:pointer; transition:all .2s;
    }
    .send-btn.active { background:var(--bleu); color:#fff; }
    .send-btn.active:hover { background:var(--orange); transform:scale(1.05); }

    .chat-empty {
      flex:1; display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      color:var(--gris); text-align:center; padding:40px;
    }
    .chat-empty svg { opacity:.2; margin-bottom:16px; }
    .chat-empty h3 { font-family:"Poppins",sans-serif; font-size:1.1rem; font-weight:700; color:var(--bleu); margin:0 0 8px; }
    .chat-empty p { font-size:.88rem; margin:0; }

    .msg-error {
      background:var(--rouge-light); color:var(--rouge);
      border-radius:8px; padding:10px 14px; font-size:.82rem;
      font-weight:600; margin:8px 16px; text-align:center;
    }

    @media (max-width:768px) {
      .msg-left { width:100%; }
      .msg-left.conv-open { display:none; }
      .msg-right { display:none; }
      .msg-right.conv-open { display:flex; }
    }
  `],
  template: `
    <div class="msg-page">

      <!-- ── GAUCHE : liste conversations ── -->
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
              Non lus{{ totalUnread() > 0 ? ' (' + totalUnread() + ')' : '' }}
            </button>
          </div>
        </div>

        <div class="conv-list">
          @if (loadingConvs()) {
            <div class="conv-loading"><div class="spin"></div> Chargement…</div>
          } @else if (filteredConvs().length === 0) {
            <div class="conv-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>Aucune conversation</p>
            </div>
          } @else {
            @for (c of filteredConvs(); track c.id) {
              <div class="conv-item" [class.active]="activeConv()?.id === c.id" (click)="openConv(c)">
                <div class="conv-av-wrap">
                  <div class="conv-av" [style.background]="c.color">
                    @if (c.avatar) { <img [src]="c.avatar" [alt]="c.name"> }
                    @else { {{ c.init }} }
                  </div>
                  @if (c.unread > 0) { <span class="unread-dot">{{ c.unread }}</span> }
                </div>
                <div class="conv-info">
                  <div class="conv-name-row">
                    <span class="conv-name">{{ c.name }}</span>
                  </div>
                  <div class="conv-last">{{ c.lastMsg }}</div>
                  <div class="conv-meta">
                    <span class="conv-time">{{ c.time }}</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- ── DROITE : chat ── -->
      <div class="msg-right" [class.conv-open]="!!activeConv()">

        @if (activeConv(); as conv) {
          <!-- Header -->
          <div class="chat-head">
            <button class="chat-back-btn" (click)="activeConv.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="chat-av" [style.background]="conv.color">
              @if (conv.avatar) { <img [src]="conv.avatar" [alt]="conv.name"> }
              @else { {{ conv.init }} }
            </div>
            <div>
              <div class="chat-name">{{ conv.name }}</div>
              <div class="chat-status">{{ conv.role }}</div>
            </div>
            <div class="chat-head-right">
              <button class="chat-more">⋮</button>
            </div>
          </div>

          <!-- Erreur -->
          @if (msgError()) {
            <div class="msg-error">{{ msgError() }}</div>
          }

          <!-- Messages -->
          <div class="chat-messages" #msgContainer>
            @if (loadingMsgs()) {
              <div style="align-self:center;padding:20px;color:var(--gris);font-size:.85rem;display:flex;gap:8px;align-items:center">
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

          <!-- Saisie -->
          <div class="chat-input-area">
            <button class="attach-btn" title="Joindre">📎</button>
            <button class="attach-btn" title="Photo">📷</button>
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
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h3>Sélectionnez une conversation</h3>
            <p>Vos échanges avec les prestataires et clients apparaissent ici.</p>
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
      return payload.user_id || -1;
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
        if (mapped.length > 0 && !this.activeConv()) this.openConv(mapped[0]);
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

    const myId = this.getMyId();

    this.http.get<any>(`${environment.apiUrl}/conversations/${c.slug}/`, { headers: this.headers }).subscribe({
      next: (res) => {
        const msgs: Msg[] = (res.messages || []).map((m: any) => ({
          id: m.id,
          body: m.body,
          mine: Number(m.sender) === myId,
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

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    try { this.ws.disconnect(); } catch {}
  }
}
