import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GeoAdminService } from '../services/geoadmin.service';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { Observable, of, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs';

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

const YEARLY_INCOME_OPTIONS = [
  { value: '0-40000',        key: '0 – 40’000',          mid: 20000, level:1 },
  { value: '40001-70000',    key: '40’001 – 70’000',     mid: 55000, level:2 },
  { value: '70001-90000',    key: '70’001 – 90’000',     mid: 80000, level:3 },
  { value: '90001-120000',   key: '90’001 – 120’000',    mid: 105000, level:4 },
  { value: 'greater than 120000', key: 'Plus de 120’000', mid: 120000, level:5 },
] as const;


@Component({
  selector: 'app-registration-form',
  standalone: true,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'fr-CH' }],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatDividerModule,
    MatIconModule, MatProgressSpinnerModule, MatAutocompleteModule
  ],
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss'],
})
export class RegistrationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private geo = inject(GeoAdminService);

  result: { ok: boolean; percentile?: number; probTrue?: number; probFalse?: number  } | null = null;
  loading = false;
  age: number | null = null;

  languageOptions: LangCode[] = ['FR','EN','DE','IT'];
  countries = [{value:'CH' as Country, key:'Suisse'},{value:'DE' as Country, key:'Allemagne'},{value:'GB' as Country, key:'Royaume-Uni'}];
  genders = [{value:'M', key:'Homme'},{value:'F', key:'Femme'}];
  maritals = [{value:'M', key:'Marié'},{value:'S', key:'Célibataire'}];
  emailPromoOptions = [
    { value: 0, key: 'Non' },
    { value: 1, key: 'Mensuelle' },
    { value: 2, key: 'Hebdomadaire' }
  ];

  educationOptions = [...EDUCATION_OPTIONS];
  occupationOptions = [...OCCUPATION_OPTIONS];
  incomeOptions = [...YEARLY_INCOME_OPTIONS];

  cityOptions$: Observable<Array<{ zip: string; city: string; canton?: string }>> = of([]);
  addressOptions$: Observable<Array<{ street: string; canton?: string; zip?: string; city?: string }>> = of([]);

  form = this.fb.group({
    language: ['FR' as LangCode],
    firstName: [''],
    lastName:  [''],
    gender:    [''],
    birthDate: [null as Date | null],
    height:    [null, [Validators.min(100), Validators.max(275)]],
    maritalStatus: [''],
    emailAddress: [''],
    phoneNumber: [''],
    emailPromotion: [0],
    country: ['CH' as Country],
    zip:     [''],
    city:    [''],
    street:  [''],
    state:   [''],
    yearlyIncome: [YEARLY_INCOME_OPTIONS[0].value],
    homeOwner: [false],
    numberCarsOwned: [0],
    totalChildren: [0],
    totalChildrenAtHome: [0],
    education: [EDUCATION_OPTIONS[2].value],
    occupation: [OCCUPATION_OPTIONS[0].value],
  });

  get isCH(): boolean {
    return this.form.controls.country.value === 'CH';
  }

  ngOnInit(): void {
    this.form.controls.birthDate.valueChanges.subscribe(d => {
      this.age = d ? this.computeAge(d) : null;
    });

    // Autocomplete
    const country$ = this.form.controls.country.valueChanges.pipe(startWith(this.form.controls.country.value));
    this.cityOptions$ = this.form.controls.zip.valueChanges.pipe(
      startWith(this.form.controls.zip.value),
      debounceTime(200),
      map(v => (v ?? '').toString().trim()),
      filter(v => v.length >= 3),
      distinctUntilChanged(),
      switchMap(zip => country$.pipe(
        map(c => ({ zip, c }))
      )),
      filter(({ c }) => c === 'CH'),
      switchMap(({ zip }) => this.geo.searchZipLocalities(zip))
    );

    this.addressOptions$ = this.form.controls.street.valueChanges.pipe(
      startWith(this.form.controls.street.value),
      debounceTime(250),
      map(v => (v ?? '').toString().trim()),
      filter(v => v.length >= 2),
      distinctUntilChanged(),
      switchMap(streetLike => country$.pipe(map(c => ({ streetLike, c })))),
      filter(({ c }) => c === 'CH'),
      switchMap(({ streetLike }) =>
        this.geo.searchAddresses(streetLike, this.form.controls.city.value ?? '')
      )
    );

    this.form.controls.country.valueChanges.subscribe(c => {
      if (c !== 'CH') {
        this.cityOptions$ = of([]);
        this.addressOptions$ = of([]);
      }
    });
  }

  onCitySelected(opt: { zip: string; city: string; canton?: string }) {
    this.form.patchValue({
      zip: opt.zip,
      city: opt.city,
      state: opt.canton ?? this.form.controls.state.value
    });
  }

  onAddressSelected(sel: { street: string; canton?: string; zip?: string; city?: string }) {
    this.form.patchValue({
      street: sel.street,
      state: sel.canton ?? this.form.controls.state.value,
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
        EmailPromotion: Number(v.emailPromotion),
        Gender: v.gender,
        BirthDate: v.birthDate ? new Date(v.birthDate).toISOString().slice(0, 10) : null,
        Age: this.age,
        Height: v.height != null ? Number(v.height) : null,
        MaritalStatus: v.maritalStatus,
        YearlyIncome: v.yearlyIncome,
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
