import { MILLISECONDS_PER_SECOND, SECONDS_PER_MINUTE } from '@app/const';
import { Observable } from 'rxjs';

export class Timer {
    time: Observable<{ min: number; sec: number }>;
    expired = false;
    increment = true;
    private intervalId: NodeJS.Timeout;
    private timeMin = 0;
    private timeSec = 0;

    getTimer(): Observable<{ min: number; sec: number }> {
        return new Observable((subscriber) => {
            if (this.increment) {
                this.intervalId = setInterval(() => {
                    this.timeSec++;
                    if (this.timeSec === SECONDS_PER_MINUTE) {
                        this.timeSec = 0;
                        this.timeMin++;
                    }
                    subscriber.next({ min: this.timeMin, sec: this.timeSec });
                }, MILLISECONDS_PER_SECOND);
            } else {
                this.intervalId = setInterval(() => {
                    if (this.timeSec > 0) {
                        this.timeSec--;
                    } else if (this.timeMin > 0) {
                        this.timeMin--;
                        this.timeSec = SECONDS_PER_MINUTE - 1;
                    } else {
                        this.stopTimer();
                    }
                    subscriber.next({ min: this.timeMin, sec: this.timeSec });
                }, MILLISECONDS_PER_SECOND);
            }
        });
    }

    setTime(min: number, sec: number) {
        this.timeMin = min;
        this.timeSec = sec;
    }

    stopTimer(): void {
        this.timeMin = 0;
        this.timeSec = 0;
        this.expired = true;
        clearInterval(this.intervalId);
    }
}
