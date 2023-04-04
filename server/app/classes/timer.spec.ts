import { SECONDS_PER_MINUTE } from '@app/const';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Timer } from './timer'; // AJOUTER @types/node dans package
describe('Timer', () => {
    let timer: Timer;

    beforeEach(() => {
        timer = new Timer();
    });

    afterEach(() => {
        timer.stopTimer();
    });

    it('should stop emitting time after stopTimer is called', (done) => {
        const subscription = timer.getTimer().subscribe(() => {
            subscription.unsubscribe();
            timer.stopTimer();
            done();
        });
    });

    it('should start with 0 minutes by default', (done) => {
        timer.getTimer().subscribe((time) => {
            expect(time.min).to.equal(0);
            done();
        });
    });

    it('should add one minute and restart the seconds when you hit 60sec', (done) => {
        timer.setTime(0, SECONDS_PER_MINUTE - 1);
        timer.getTimer().subscribe((time) => {
            expect(time.min).to.equal(1);
            expect(time.sec).to.equal(0);
            done();
        });
    });

    it('on decrement should remove one seconde when the secondes are higher then 0 starting at 60', (done) => {
        timer.increment = false;
        timer.setTime(0, SECONDS_PER_MINUTE);
        timer.getTimer().subscribe((time) => {
            expect(time.sec).to.equal(SECONDS_PER_MINUTE - 1);
            done();
        });
    });

    it('on decrement should remove one minute when the secondes are 0 and reset secondes to 59', (done) => {
        timer.increment = false;
        timer.setTime(3, 0);
        timer.getTimer().subscribe((time) => {
            expect(time.sec).to.equal(SECONDS_PER_MINUTE - 1);
            expect(time.min).to.equal(2);
            done();
        });
    });

    it('on decrement should stopTimer when the minutes and secondes ar 0', (done) => {
        timer.increment = false;
        const spy = sinon.spy(timer, 'stopTimer');
        timer.setTime(0, 0);
        timer.getTimer().subscribe(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(spy.calledOnce).to.be.true;
            done();
        });
    });
});
