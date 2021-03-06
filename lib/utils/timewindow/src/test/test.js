'use strict';

// Time window utilities
/* eslint-disable nodate/nomoment, nodate/nonewdate, nodate/nodate */

const moment = require('abacus-moment');
const time = require('..');
const createTimeWindow = time.timeWindowsSizes;
const dimension = time.dimension;

describe('abacus-timewindow', () => {
  it('Calculate the index of a time window', () => {
    const win = [null, null, null, null, null];

    // Set current time to 2016-03-10:12:01:30 UTC
    const now = moment.utc([2016, 2, 10, 12, 1, 30]);

    // Try month window
    let date = moment.utc([2016, 1, 27]);
    expect(time.timeWindowIndex(win, now, date, 'M')).to.equal(1);

    // Try a month window with a larger difference than the window length
    date = moment.utc([2015, 0, 23]);
    expect(time.timeWindowIndex(win, now, date, 'M')).to.equal(-1);

    // Try month window that allows exceeding the window length
    date = moment.utc([2015, 0, 23]);
    expect(time.timeWindowIndex(win, now, date, 'M', true)).to.equal(14);

    // Try week window
    date = moment.utc([2016, 2, 7]);
    expect(time.timeWindowIndex(win, now, date, 'W')).to.equal(0);
    date = moment.utc([2016, 2, 5]);
    expect(time.timeWindowIndex(win, now, date, 'W')).to.equal(1);
    date = moment.utc([2016, 1, 26]);
    expect(time.timeWindowIndex(win, now, date, 'W')).to.equal(2);

    // Try date window
    date = moment.utc([2016, 2, 7, 23, 23, 23]);
    expect(time.timeWindowIndex(win, now, date, 'D')).to.equal(3);

    // Try hour window
    date = moment.utc([2016, 2, 10, 10, 23, 23]);
    expect(time.timeWindowIndex(win, now, date, 'h')).to.equal(2);

    // Try minute window
    date = moment.utc([2016, 2, 10, 11, 59, 23]);
    expect(time.timeWindowIndex(win, now, date, 'm')).to.equal(2);

    // Try second window
    date = moment.utc([2016, 2, 10, 12, 1, 26]);
    expect(time.timeWindowIndex(win, now, date, 's')).to.equal(4);
  });

  it('Shift a time window', () => {
    let win;
    let date;

    const now = moment.utc([2016, 2, 10, 12, 1, 30]);

    // Try month window
    win = [1, 2, 3];
    date = moment.utc([2016, 1, 27]);
    time.shiftWindow(date, now, win, 'M');
    expect(win).to.deep.equal([null, 1, 2]);

    // Try a month window with a larger difference than the window length
    date = moment.utc([2015, 0, 23]);
    win = [1, 2, 3];
    time.shiftWindow(date, now, win, 'M');
    expect(win).to.deep.equal([null, null, null]);

    // Try date window
    date = moment.utc([2016, 2, 8, 23, 23, 23]);
    win = [1, 2, 3];
    time.shiftWindow(date, now, win, 'D');
    expect(win).to.deep.equal([null, null, 1]);

    // Try hour window
    date = moment.utc([2016, 2, 10, 12, 23, 23]);
    win = [1, 2, 3];
    time.shiftWindow(date, now, win, 'h');
    expect(win).to.deep.equal([1, 2, 3]);

    // Try minute window
    date = moment.utc([2016, 2, 10, 11, 59, 23]);
    win = [1, 2, 3];
    time.shiftWindow(date, now, win, 'm');
    expect(win).to.deep.equal([null, null, 1]);

    // Try second window
    date = moment.utc([2016, 2, 10, 12, 1, 27]);
    win = [1, 2, 3];
    time.shiftWindow(date, now, win, 's');
    expect(win).to.deep.equal([null, null, null]);
  });

  it('calculate the bounds of a window', () => {
    const date = moment.utc([2016, 1, 23, 23, 23, 23, 23]);

    // Try month window
    let from = moment.utc([2016, 1]).toDate();
    let to = moment.utc([2016, 2]).toDate();
    expect(time.timeWindowBounds(date, 'M')).to.deep.equal({
      from: from,
      to: to
    });

    // Try month window with a shift
    from = moment.utc([2016, 0]).toDate();
    to = moment.utc([2016, 1]).toDate();
    expect(time.timeWindowBounds(date, 'M', -1)).to.deep.equal({
      from: from,
      to: to
    });

    // Try date window
    from = moment.utc([2016, 1, 23]).toDate();
    to = moment.utc([2016, 1, 24]).toDate();
    expect(time.timeWindowBounds(date, 'D')).to.deep.equal({
      from: from,
      to: to
    });

    // Try hour window
    from = moment.utc([2016, 1, 23, 23]).toDate();
    to = moment.utc([2016, 1, 23, 24]).toDate();
    expect(time.timeWindowBounds(date, 'h')).to.deep.equal({
      from: from,
      to: to
    });

    // Try minute window
    from = moment.utc([2016, 1, 23, 23, 23]).toDate();
    to = moment.utc([2016, 1, 23, 23, 24]).toDate();
    expect(time.timeWindowBounds(date, 'm')).to.deep.equal({
      from: from,
      to: to
    });

    // Try second window
    from = moment.utc([2016, 1, 23, 23, 23, 23]).toDate();
    to = moment.utc([2016, 1, 23, 23, 23, 24]).toDate();
    expect(time.timeWindowBounds(date, 's')).to.deep.equal({
      from: from,
      to: to
    });
  });

  it('provides get cell function', () => {
    const June7th = 1465282800001;
    const June8th = 1465369200001;

    // Slack set to 2D. processed June8th, doc is at June7th
    let cellfn = time.cellfn(
      [[null], [null], [null], [{ quantity: 5 }, { quantity: 25 }], [{ quantity: 30 }, null]],
      June8th,
      June7th
    );

    expect(cellfn('s')).to.equal(undefined);
    expect(cellfn('m')).to.equal(undefined);
    expect(cellfn('h')).to.equal(undefined);
    expect(cellfn('D')).to.deep.equal({ quantity: 25 });
    expect(cellfn('M')).to.deep.equal({ quantity: 30 });

    // Slack set to 2D. processed June8th, doc is at June8th
    cellfn = time.cellfn(
      [[null], [null], [null], [{ quantity: 5 }, { quantity: 25 }], [{ quantity: 30 }, null]],
      June8th,
      June8th
    );

    expect(cellfn('s')).to.equal(null);
    expect(cellfn('m')).to.equal(null);
    expect(cellfn('h')).to.equal(null);
    expect(cellfn('D')).to.deep.equal({ quantity: 5 });
    expect(cellfn('M')).to.deep.equal({ quantity: 30 });
  });

  it('adjusts the time window', () => {
    const timewindow = [[null], [null], [null], [5, 4, 3, 2, 1], ['Now', 'Last']];
    const twCreation = moment.utc([2016, 5, 5]);

    // Expect the days to get cut down.
    let adjustTo = moment.utc([2016, 5, 3]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[3]).to.deep.equal([3, 2, 1]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[4]).to.deep.equal(['Now', 'Last']);

    // Expect the days to get cut down.
    adjustTo = moment.utc([2016, 5, 4]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[3]).to.deep.equal([4, 3, 2, 1]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[4]).to.deep.equal(['Now', 'Last']);

    // Same day
    adjustTo = moment.utc([2016, 5, 5]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[3]).to.deep.equal([5, 4, 3, 2, 1]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[4]).to.deep.equal(['Now', 'Last']);

    // Date2 > date1
    adjustTo = moment.utc([2016, 5, 6]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[3]).to.deep.equal([5, 4, 3, 2, 1]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[4]).to.deep.equal(['Now', 'Last']);

    // month
    adjustTo = moment.utc([2016, 4, 6]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[3]).to.deep.equal([5, 4, 3, 2, 1]);
    expect(time.adjustWindows(timewindow, twCreation, adjustTo)[4]).to.deep.equal(['Last']);
  });

  context('when windows sizes are provided', () => {
    it('expect windows to be initialized', () => {
      const timeWindow = createTimeWindow({}, { [dimension.min]: 2 });
      const windows = timeWindow.getWindows(dimension.min);
      expect(windows).to.deep.equal([null, null]);
    });
  });

  context('when windows sizes are not provided', () => {
    context('when slack period is within its dimension', () => {
      it('expect slack + 1 windows intitialized', () => {
        const timeWindow = createTimeWindow({ scale: dimension.min, width: 3 });
        const windows = timeWindow.getWindows(dimension.min);
        expect(windows).to.deep.equal([null, null, null, null]);
      });
    });

    context('when slack period afects the next dimension', () => {
      it('expect (width div <dimension size>) + 1 windows initialized', () => {
        const timeWindow = createTimeWindow({ scale: dimension.day, width: 30 });
        const windows = timeWindow.getWindows(dimension.month);
        expect(windows).to.deep.equal([null, null, null]);
      });
    });
  });
});
