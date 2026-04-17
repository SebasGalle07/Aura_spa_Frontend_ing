import { NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatbotService } from '../core/chatbot.service';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [FormsModule, NgClass, NgFor, NgIf],
  template: `
    <button
      class="chat-toggle"
      type="button"
      (click)="togglePanel()"
      [attr.aria-expanded]="open"
      aria-label="Abrir asistente virtual Aura Spa"
    >
      <svg class="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="chat-label">Aura</span>
      <span class="chat-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
    </button>

    <section class="chat-panel" *ngIf="open" aria-label="Chat contextual Aura Spa">
      <header>
        <div class="chat-header-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <div>
            <strong>Asistente Aura Spa</strong>
            <span>Servicios, reservas y politicas</span>
          </div>
        </div>
        <button type="button" (click)="open = false" aria-label="Cerrar chat">&times;</button>
      </header>

      <div class="messages" #messagesContainer>
        <div class="message" *ngFor="let msg of messages" [ngClass]="'message--' + msg.sender">
          {{ msg.text }}
        </div>
        <div class="message message--bot typing" *ngIf="sending">
          <span></span><span></span><span></span>
        </div>
      </div>

      <form (ngSubmit)="send()">
        <input
          #inputRef
          type="text"
          name="message"
          [(ngModel)]="message"
          placeholder="Pregunta por servicios, pagos..."
          [disabled]="sending"
          autocomplete="off"
        />
        <button class="send-btn" type="submit" [disabled]="sending || !message.trim()" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </section>
  `,
  styles: [
    `
      .chat-toggle {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 40;
        border: none;
        border-radius: 999px;
        width: 58px;
        height: 58px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        background: var(--espresso, #3d2b24);
        color: var(--cream, #fffaf3);
        box-shadow: 0 8px 24px rgba(54, 38, 30, 0.35);
        cursor: pointer;
        padding: 0;
      }

      .chat-toggle:hover {
        background: #5a3e34;
      }

      .chat-icon {
        width: 22px;
        height: 22px;
      }

      .chat-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        line-height: 1;
      }

      .chat-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #e53e3e;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        border: 2px solid #fff;
        pointer-events: none;
      }

      .chat-panel {
        position: fixed;
        right: 22px;
        bottom: 90px;
        z-index: 40;
        width: min(360px, calc(100vw - 32px));
        background: #fffaf3;
        border: 1px solid #d8c7b4;
        border-radius: 18px;
        box-shadow: 0 22px 50px rgba(54, 38, 30, 0.25);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #3d2b24, #7b5a44);
        color: #fffaf3;
        flex-shrink: 0;
      }

      .chat-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .chat-header-info svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        opacity: 0.9;
      }

      .chat-header-info strong {
        display: block;
        font-size: 14px;
      }

      header span {
        display: block;
        font-size: 11px;
        opacity: 0.78;
      }

      header > button {
        border: none;
        background: rgba(255,255,255,0.15);
        color: inherit;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      header > button:hover {
        background: rgba(255,255,255,0.25);
      }

      .messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 300px;
        overflow-y: auto;
        padding: 14px;
        scroll-behavior: smooth;
      }

      .message {
        border-radius: 14px;
        padding: 10px 12px;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-line;
        max-width: 88%;
        word-break: break-word;
      }

      .message--bot {
        background: #f0e4d7;
        color: #3d2b24;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }

      .message--user {
        background: #3d2b24;
        color: #fffaf3;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }

      .typing {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 12px 16px;
      }

      .typing span {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #7b5a44;
        animation: bounce 1.2s infinite ease-in-out;
      }

      .typing span:nth-child(2) { animation-delay: 0.2s; }
      .typing span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }

      form {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid #e3d7c9;
        flex-shrink: 0;
      }

      input {
        min-width: 0;
        flex: 1;
        border: 1px solid #cbb9a5;
        border-radius: 999px;
        padding: 9px 14px;
        font-size: 13px;
        background: #fff;
        outline: none;
      }

      input:focus {
        border-color: #7b5a44;
      }

      .send-btn {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 999px;
        background: #3d2b24;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: background 0.15s;
      }

      .send-btn:hover:not(:disabled) {
        background: #5a3e34;
      }

      .send-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .send-btn svg {
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class ChatbotWidgetComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('inputRef') private inputRef?: ElementRef<HTMLInputElement>;

  open = false;
  message = '';
  sending = false;
  unreadCount = 0;
  conversationId?: number;
  messages: ChatMessage[] = [
    {
      sender: 'bot',
      text: 'Hola. Soy el asistente de Aura Spa. Preguntame por servicios, reservas, pagos o cancelaciones.',
    },
  ];

  private shouldScroll = false;

  constructor(private chatbot: ChatbotService) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  togglePanel(): void {
    this.open = !this.open;
    if (this.open) {
      this.unreadCount = 0;
      this.shouldScroll = true;
      setTimeout(() => this.inputRef?.nativeElement.focus(), 0);
    }
  }

  send(): void {
    const text = this.message.trim();
    if (!text || this.sending) {
      return;
    }
    this.messages = [...this.messages, { sender: 'user', text }];
    this.message = '';
    this.sending = true;
    this.shouldScroll = true;
    this.chatbot.send(text, this.conversationId).subscribe({
      next: (response) => {
        this.conversationId = response.conversation_id;
        this.messages = [...this.messages, { sender: 'bot', text: response.response }];
        this.sending = false;
        this.shouldScroll = true;
        if (!this.open) {
          this.unreadCount++;
        }
      },
      error: () => {
        this.messages = [...this.messages, { sender: 'bot', text: 'No pude responder en este momento. Intenta nuevamente.' }];
        this.sending = false;
        this.shouldScroll = true;
      },
    });
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
