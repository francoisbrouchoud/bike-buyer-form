import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, BikeBuyerPayload } from '../services/api.service';

type Country = 'CH' | 'DE' | 'GB';
type LangCode = 'EN'|'FR'|'DE'|'IT';

const EDUCATION_OPTIONS = [
  { value: 'Partial High School', key: 'partialHighSchool' },
  { value: 'High School', key: 'highSchool' },
  { value: 'Partial College', key: 'partialCollege' },
  { value: 'Bachelors', key: 'bachelors' },
  { value: 'Graduate Degree', key: 'graduateDegree' }
] as const;

const OCCUPATION_OPTIONS = [
  { value: 'Professional', key: 'professional' },
  { value: 'Skilled Manual', key: 'skilledManual' },
  { value: 'Management', key: 'management' },
  { value: 'Clerical', key: 'clerical' },
  { value: 'Manual', key: 'manual' }
] as const;

@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatDividerModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss'],
})
export class RegistrationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  result: { ok: boolean; percentile?: number; probTrue?: number; probFalse?: number  } | null = null;
  loading = false;
  age: number | null = null;

  languageOptions: LangCode[] = ['FR','EN','DE','IT'];
  countries = [{value:'CH' as Country, key:'CH'},{value:'DE' as Country, key:'DE'},{value:'GB' as Country, key:'GB'}];
  genders = [{value:'M', key:'male'},{value:'F', key:'female'}];
  maritals = [{value:'M', key:'married'},{value:'S', key:'single'}];
  yesNo = [{value:1, key:'yes'},{value:0, key:'no'}];

  educationOptions = [...EDUCATION_OPTIONS];
  occupationOptions = [...OCCUPATION_OPTIONS];

  form = this.fb.group({
    language: ['FR' as LangCode],
    firstName: [''],
    lastName:  [''],
    gender:    ['M'],
    birthDate: [null as Date | null],
    height:    [null as number | null],
    maritalStatus: ['S'],
    emailAddress: [''],
    phoneNumber: [''],
    emailPromotion: [0],
    country: ['CH' as Country],
    zip:     [''],
    city:    [''],
    street:  [''],
    state:   [''],
    yearlyIncome: [null as number | null],
    homeOwner: [false],
    numberCarsOwned: [0],
    totalChildren: [0],
    totalChildrenAtHome: [0],
    education: [EDUCATION_OPTIONS[2].value],
    occupation: [OCCUPATION_OPTIONS[0].value],
  });

  ngOnInit(): void {
    this.form.controls.birthDate.valueChanges.subscribe(d => {
      this.age = d ? this.computeAge(d) : null;
    });
  }

  private computeAge(d: Date): number {
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
    }

  submit() {
    this.result = null;
    this.loading = true;

    const v = this.form.getRawValue();
    const payload: BikeBuyerPayload = {
      features: {
        Language: v.language,
        FirstName: v.firstName,
        LastName: v.lastName,
        Country: v.country,
        Zip: v.zip,
        City: v.city,
        Street: v.street,
        State: v.state,
        PhoneNumber: v.phoneNumber,
        EmailAddress: v.emailAddress,
        EmailPromotion: Number(v.emailPromotion) === 1 ? 1 : 0,
        Gender: v.gender,
        BirthDate: v.birthDate ? new Date(v.birthDate).toISOString().slice(0, 10) : null,
        Age: this.age,
        Height: v.height != null ? Number(v.height) : null,
        MaritalStatus: v.maritalStatus,
        YearlyIncome: v.yearlyIncome != null ? Number(v.yearlyIncome) : null,
        TotalChildren: Number(v.totalChildren),
        TotalChildrenAtHome: Number(v.totalChildrenAtHome),
        Education: v.education,
        Occupation: v.occupation,
        HomeOwner: !!v.homeOwner,
        NumberCarsOwned: Number(v.numberCarsOwned),
      }
    };

    this.api.predict(payload).subscribe({
      next: r => {
        this.loading = false;
        this.result = { ok: r.isBikeBuyer, percentile: r.percentile, probTrue: r.probTrue, probFalse: r.probFalse };
      },
      error: () => {
        this.loading = false;
        this.result = { ok: false };
      }
    });
  }
}
