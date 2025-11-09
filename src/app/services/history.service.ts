import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface HistoryRow {
  firstName: string;
  lastName: string;
  email: string;
  isBuyer: boolean;
  percentile?: number | null;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private storageKey = 'bb_history_v1';
  private rowsSubject = new BehaviorSubject<HistoryRow[]>(this.read());
  rows$ = this.rowsSubject.asObservable();

  add(row: Omit<HistoryRow, 'date'>) {
    const withDate: HistoryRow = { ...row, date: new Date().toISOString() };
    const next = [withDate, ...this.rowsSubject.value].slice(0, 50);
    this.write(next);
    this.rowsSubject.next(next);
  }

  remove(index: number) {
    const next = this.rowsSubject.value.slice();
    next.splice(index, 1);
    this.write(next);
    this.rowsSubject.next(next);
  }

  clear() {
    this.write([]);
    this.rowsSubject.next([]);
  }

  private read(): HistoryRow[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(rows: HistoryRow[]) {
    try { localStorage.setItem(this.storageKey, JSON.stringify(rows)); } catch {}
  }
}
