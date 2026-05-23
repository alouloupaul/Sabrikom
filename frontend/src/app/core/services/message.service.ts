import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Conversation, Message } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/messages`;

  send(listingId: number, receiverId: string, content: string) {
    return this.http.post<Message>(this.base, { listingId, receiverId, content });
  }

  getConversations() {
    return this.http.get<Conversation[]>(`${this.base}/conversations`);
  }

  getConversation(listingId: number, otherUserId: string) {
    return this.http.get<Message[]>(`${this.base}/conversation/${listingId}/${otherUserId}`);
  }

  getUnreadCount() {
    return this.http.get<number>(`${this.base}/unread-count`);
  }
}
