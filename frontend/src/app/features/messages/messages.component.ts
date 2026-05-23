import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../core/services/message.service';
import { LangService } from '../../core/services/lang.service';
import { Conversation } from '../../core/models';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [RouterLink, TranslateModule, CommonModule],
  template: `
    <div class="container" style="padding:2rem 1rem">
      <h1>{{ 'messages.title' | translate }}</h1>
      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else if (conversations().length === 0) {
        <div style="text-align:center;padding:3rem;color:var(--text-light)">
          {{ 'messages.no_conversations' | translate }}
        </div>
      } @else {
        <div class="conversations-list">
          @for (conv of conversations(); track conv.listingId + conv.otherUserId) {
            <a class="conversation-item"
              [routerLink]="['/messages', conv.listingId, conv.otherUserId]">
              @if (conv.listingMainPhoto) {
                <img [src]="conv.listingMainPhoto" class="conv-photo" />
              } @else {
                <div class="conv-photo-placeholder">🔧</div>
              }
              <div class="conv-info">
                <div class="conv-header">
                  <span class="conv-user">{{ conv.otherUserName }}</span>
                  <span class="conv-time">{{ conv.lastMessageAt | date:'dd/MM HH:mm' }}</span>
                </div>
                <div class="conv-listing">
                  {{ lang.currentLang() === 'ar' ? conv.listingTitleAr : conv.listingTitleFr }}
                </div>
                <div class="conv-last">{{ conv.lastMessage }}</div>
              </div>
              @if (conv.unreadCount > 0) {
                <span class="unread-badge">{{ conv.unreadCount }}</span>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .conversations-list { display:flex; flex-direction:column; gap:0.5rem; }
    .conversation-item {
      display:flex; align-items:center; gap:1rem;
      background:#fff; border-radius:var(--radius); box-shadow:var(--shadow);
      padding:1rem; text-decoration:none; color:inherit; transition:all 0.2s;
    }
    .conversation-item:hover { box-shadow:var(--shadow-hover); }
    .conv-photo { width:56px; height:56px; object-fit:cover; border-radius:8px; flex-shrink:0; }
    .conv-photo-placeholder { width:56px; height:56px; background:#eee; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink:0; }
    .conv-info { flex:1; min-width:0; }
    .conv-header { display:flex; justify-content:space-between; margin-bottom:0.2rem; }
    .conv-user { font-weight:700; font-size:0.95rem; }
    .conv-time { font-size:0.8rem; color:var(--text-light); }
    .conv-listing { font-size:0.85rem; color:var(--text-light); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .conv-last { font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .unread-badge { background:var(--primary); color:#fff; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; }
  `]
})
export class MessagesComponent implements OnInit {
  private messageService = inject(MessageService);
  lang = inject(LangService);
  conversations = signal<Conversation[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.messageService.getConversations().subscribe(c => {
      this.conversations.set(c);
      this.loading.set(false);
    });
  }
}
