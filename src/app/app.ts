import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationFormComponent } from './features/registration-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RegistrationFormComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {}
