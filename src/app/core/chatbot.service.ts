import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ChatbotResponse {
  conversation_id: number;
  response: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient) {}

  send(message: string, conversationId?: number | null): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${environment.apiUrl}/chatbot/message`, {
      message,
      conversation_id: conversationId ?? null,
    });
  }
}
