
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as Rx from 'rxjs';
import { v4 as uuid } from 'uuid';

export interface Message {
  time: Date;
  sender: string;
  content: string;
  uid: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('viewer') private viewer: ElementRef;
  private socket: Rx.Subject<Message>;

  public serverMessages: Message[] = [];
  public clientMessage = '';
  public sender = '';
  public currentUID = uuid();

  constructor() {
      this.socket = this.create('wss://peaceful-cliffs-37961.herokuapp.com/');

      this.socket
          .subscribe(
          (message: any) => {
            this.serverMessages = JSON.parse(message.data),
            this.scroll();
          },
          (err) => console.error(err),
          () => console.warn('Completed!')
          );
  }

  create(url): Rx.Subject<Message> {
    const ws = new WebSocket(url);
    const observable = Rx.Observable.create(
        (obs: Rx.Observer<Message>) => {
            ws.onmessage = obs.next.bind(obs);
            ws.onerror = obs.error.bind(obs);
            ws.onclose = obs.complete.bind(obs);
            return ws.close.bind(ws);
        }
    );
    const observer = {
        next: (data: Object) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        },
    };
    return Rx.Subject.create(observer, observable);
}

  ngAfterViewInit(): void {
    this.scroll();
  }

  send(): void {
    const message: Message = {
      time: new Date(),
      sender: this.sender,
      content: this.clientMessage,
      uid: this.currentUID
    };

    this.socket.next(message);
    this.clientMessage = '';
    this.scroll();
  }

  isMine(message: Message): boolean {
    return message && message.sender === this.sender;
  }

  getSenderInitials(sender: string): string {
    return sender && sender.substring(0, 2).toLocaleUpperCase();
  }

  getSenderColor(sender: string): string {
    const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZ';
    const initials = this.getSenderInitials(sender);
    const value = Math.ceil((alpha.indexOf(initials[0]) + alpha.indexOf(initials[1])) * 255 * 255 * 255 / 70);
    return '#' + value.toString(16).padEnd(6, '0');
  }

  scroll(): void {
    setTimeout(() => {
        this.scrollToBottom();
    }, 100);
  }

  getDiff(): number {
    if (!this.viewer) {
        return -1;
    }

    const nativeElement = this.viewer.nativeElement;
    return nativeElement.scrollHeight - (nativeElement.scrollTop + nativeElement.clientHeight);
  }

  scrollToBottom(t = 1, b = 0): void {
    if (b < 1) {
        b = this.getDiff();
    }
    if (b > 0 && t <= 120) {
      setTimeout(() => {
          const diff = this.easeInOutSin(t / 120) * this.getDiff();
          this.viewer.nativeElement.scrollTop += diff;
          this.scrollToBottom(++t, b);
      }, 1 / 60);
    }
  }

  easeInOutSin(t): number {
    return (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
  }

  setUser(event) {
    this.sender = event.srcElement.value;
    this.currentUID = uuid();
  }
}
