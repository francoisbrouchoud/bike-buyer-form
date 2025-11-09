import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { HistoryService } from '../services/history.service';

@Component({
  selector: 'app-submission-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './submission-history.component.html',
  styleUrls: ['./submission-history.component.scss'],
})
export class SubmissionHistoryComponent {
  history = inject(HistoryService);
  remove(i: number) { this.history.remove(i); }
  clear() { this.history.clear(); }
}
