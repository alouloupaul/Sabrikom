import { Component, OnInit, inject, signal, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { Message } from '../../core/models';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [FormsModule, TranslateModule, CommonModule, RouterLink],
  template: `
    <div class="container conv-page">
      <a routerLink="/messages" class="btn btn-secondary btn-sm back-btn">← {{ 'common.back' | translate }}</a>

      <div class="messages-container" #messagesContainer>
        @if (loading()) {
          <div class="loading-center"><div class="spinner"></div></div>
        } @else {
          @for (msg of messages(); track msg.id) {
            <div class="message-bubble" [class.mine]="msg.senderId === currentUserId">
              <div class="bubble-content">{{ msg.content }}</div>
              <div class="bubble-time">{{ msg.sentAt | date:'HH:mm' }}</div>
            </div>
          }
        }
      </div>

      <div class="message-input-row">
        <textarea class="form-control" [(ngModel)]="newMessage" rows="2"
          [placeholder]="'messages.type_message' | translate"
          (keydown.enter)="$event.preventDefault(); sendMessage()"></textarea>
        <button class="btn btn-primary" (click)="sendMessage()" [disabled]="!newMessage.trim()">
          {{ 'messages.send' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .conv-page { padding:1.5rem 1rem; display:flex; flex-direction:column; height:calc(100vh - 140px); }
    .back-btn { margin-bottom:1rem; align-self:flex-start; }
    .messages-container { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0.75rem; padding:1rem; background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); margin-bottom:1rem; }
    .message-bubble { display:flex; flex-direction:column; max-width:70%; }
    .message-bubble.mine { align-self:flex-end; align-items:flex-end; }
    .bubble-content { background:#f0f0f0; padding:0.6rem 1rem; border-radius:16px; font-size:0.95rem; line-height:1.5; }
    .mine .bubble-content { background:var(--primary); color:#fff; }
    .bubble-time { font-size:0.75rem; color:var(--text-light); margin-top:0.2rem; }
    .message-input-row { display:flex; gap:0.75rem; align-items:flex-end; }
    .message-input-row .form-control { flex:1; }
  `]
})
export class ConversationComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private container!: ElementRef;
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private auth = inject(AuthService);

  messages = signal<Message[]>([]);
  loading = signal(true);
  newMessage = '';
  listingId!: number;
  otherUserId!: string;
  currentUserId = this.auth.user()?.userId ?? '';

  ngOnInit() {
    this.listingId = +this.route.snapshot.paramMap.get('listingId')!;
    this.otherUserId = this.route.snapshot.paramMap.get('otherUserId')!;
    this.messageService.getConversation(this.listingId, this.otherUserId).subscribe(msgs => {
      this.messages.set(msgs);
      this.loading.set(false);
    });
  }

  ngAfterViewChecked() {
    if (this.container) {
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.messageService.send(this.listingId, this.otherUserId, this.newMessage).subscribe(msg => {
      this.messages.update(msgs => [...msgs, msg]);
      this.newMessage = '';
    });
  }
}
