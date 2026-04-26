import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBlacklist,
  saveBlacklist,
  getHistory,
  addScanRecord,
  deleteScanRecord,
  clearHistory,
} from '../../lib/storage';
import type { ScanRecord } from '../../lib/types';

// Helper to create a minimal valid ScanRecord
const makeScanRecord = (id: string): ScanRecord => ({
  id,
  createdAt: '2026-04-25T10:00:00.000Z',
  dishes: [],
  blacklistSnapshot: [],
});

describe('getBlacklist', () => {
  beforeEach(() => localStorage.clear());

  it('returns [] when storage is empty', () => {
    expect(getBlacklist()).toEqual([]);
  });

  it('returns the stored array', () => {
    localStorage.setItem('foodfilter_blacklist', JSON.stringify(['peanuts', 'dairy']));
    expect(getBlacklist()).toEqual(['peanuts', 'dairy']);
  });

  it('returns [] and does not throw on corrupt JSON', () => {
    localStorage.setItem('foodfilter_blacklist', '{invalid}');
    expect(getBlacklist()).toEqual([]);
  });

  it('returns [] when stored value is valid JSON but not an array', () => {
    localStorage.setItem('foodfilter_blacklist', '"just-a-string"');
    expect(getBlacklist()).toEqual([]);
  });
});

describe('saveBlacklist', () => {
  beforeEach(() => localStorage.clear());

  it('persists the array to localStorage', () => {
    saveBlacklist(['gluten', 'nuts']);
    expect(JSON.parse(localStorage.getItem('foodfilter_blacklist')!)).toEqual(['gluten', 'nuts']);
  });

  it('overwrites the previous value', () => {
    saveBlacklist(['a']);
    saveBlacklist(['b', 'c']);
    expect(getBlacklist()).toEqual(['b', 'c']);
  });
});

describe('getHistory', () => {
  beforeEach(() => localStorage.clear());

  it('returns [] when storage is empty', () => {
    expect(getHistory()).toEqual([]);
  });

  it('returns the stored history array', () => {
    const rec = makeScanRecord('1');
    localStorage.setItem('foodfilter_history', JSON.stringify([rec]));
    expect(getHistory()).toEqual([rec]);
  });

  it('returns [] and does not throw on corrupt JSON', () => {
    localStorage.setItem('foodfilter_history', 'BROKEN');
    expect(getHistory()).toEqual([]);
  });

  it('returns [] when stored value is valid JSON but not an array', () => {
    localStorage.setItem('foodfilter_history', '42');
    expect(getHistory()).toEqual([]);
  });
});

describe('addScanRecord', () => {
  beforeEach(() => localStorage.clear());

  it('prepends a new record so newest is first', () => {
    const first = makeScanRecord('1');
    const second = makeScanRecord('2');
    addScanRecord(first);
    addScanRecord(second);
    const history = getHistory();
    expect(history[0].id).toBe('2');
    expect(history[1].id).toBe('1');
  });

  it('works on an empty history', () => {
    addScanRecord(makeScanRecord('a'));
    expect(getHistory()).toHaveLength(1);
  });
});

describe('deleteScanRecord', () => {
  beforeEach(() => localStorage.clear());

  it('removes the record matching the given id', () => {
    addScanRecord(makeScanRecord('a'));
    addScanRecord(makeScanRecord('b'));
    deleteScanRecord('a');
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('b');
  });

  it('does nothing when id is not found', () => {
    addScanRecord(makeScanRecord('a'));
    deleteScanRecord('z');
    expect(getHistory()).toHaveLength(1);
  });
});

describe('clearHistory', () => {
  beforeEach(() => localStorage.clear());

  it('removes all records', () => {
    addScanRecord(makeScanRecord('a'));
    addScanRecord(makeScanRecord('b'));
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it('does not throw when history is already empty', () => {
    expect(() => clearHistory()).not.toThrow();
  });
});
