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
import { HttpClient } from '@angular/common/http';
import { SubmissionHistoryComponent } from './submission-history.component';
import { HistoryService } from '../services/history.service';

type Country = 'CH' | 'DE' | 'GB';
type LangCode = 'EN'|'FR'|'DE'|'IT';

const EDUCATION_OPTIONS = [
  { value: 'Partial High School', level: 1 },
  { value: 'High School', level: 2 },
  { value: 'Partial College', level: 3 },
  { value: 'Bachelors', level : 4},
  { value: 'Graduate Degree', level: 5 }
] as const;

const OCCUPATION_OPTIONS = [
  { value: 'Professional' },
  { value: 'Skilled Manual'},
  { value: 'Management'},
  { value: 'Clerical'},
  { value: 'Manual'}
] as const;

const YEARLY_INCOME_OPTIONS = [
  { value: '0-40000',        key: '0 – 40’000',          mid: 20000, level:1 },
  { value: '40001-70000',    key: '40’001 – 70’000',     mid: 55000, level:2 },
  { value: '70001-90000',    key: '70’001 – 90’000',     mid: 80000, level:3 },
  { value: '90001-120000',   key: '90’001 – 120’000',    mid: 105000, level:4 },
  { value: 'greater than 120000', key: 'Plus de 120’000', mid: 120000, level:5 },
] as const;

type TitleValue =
  | 'Herr' | 'Frau'
  | 'Mister' | 'Mrs'
  | 'Monsieur' | 'Madame'
  | 'Signore' | 'Signora';

  const TITLES_BY_LANG: Record<LangCode, ReadonlyArray<{ value: TitleValue; key: string }>> = {
  FR: [
    { value: 'Monsieur', key: 'Monsieur' },
    { value: 'Madame',   key: 'Madame' },
  ],
  EN: [
    { value: 'Mister', key: 'Mister' },
    { value: 'Mrs',    key: 'Mrs' },
  ],
  DE: [
    { value: 'Herr', key: 'Herr' },
    { value: 'Frau', key: 'Frau' },
  ],
  IT: [
    { value: 'Signore', key: 'Signore' },
    { value: 'Signora', key: 'Signora' },
  ],
} as const;


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX= /^(?=(?:.*\d){6,})[0-9+().\-\/\sx]+$/i;


@Component({
  selector: 'app-registration-form',
  standalone: true,
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'fr-CH' }],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatDividerModule,
    MatIconModule, MatProgressSpinnerModule, MatAutocompleteModule,
    SubmissionHistoryComponent
  ],
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss'],
})
export class RegistrationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private geo = inject(GeoAdminService);
  private http = inject(HttpClient);
  private urbanLevelByCity = new Map<string, number>();
  private history = inject(HistoryService);

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
    title: [TITLES_BY_LANG['FR'][0].value as TitleValue],
    firstName: [''],
    lastName:  [''],
    gender:    [''],
    birthDate: [null as Date | null],
    height:    [null, [Validators.min(100), Validators.max(275)]],
    maritalStatus: [''],
    emailAddress: ['', [Validators.pattern(EMAIL_REGEX)]],
    phoneNumber: ['', [Validators.pattern(PHONE_REGEX)]],
    emailPromotion: [0],
    country: ['CH' as Country],
    zip:     [''],
    city:    [''],
    street:  [''],
    state:   [''],
    yearlyIncome: [YEARLY_INCOME_OPTIONS[0].value],
    homeOwner: [false],
    numberCarsOwned: [0, [Validators.min(0)]],
    totalChildren: [0, [Validators.min(0)]],
    totalChildrenAtHome: [0, [Validators.min(0)]],
    education: [''],
    occupation: [''],
  });

  get isCH(): boolean {
    return this.form.controls.country.value === 'CH';
  }

  ngOnInit(): void {
    this.loadTownTypology();

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

    {
      const initLang = (this.form.controls.language.value || 'FR') as LangCode;
      const initOpts = TITLES_BY_LANG[initLang] ?? [];
      this.form.controls.title.setValue(initOpts[0]?.value ?? '');
    }

    this.form.controls.language.valueChanges.subscribe((lang) => {
      const l = (lang || 'FR') as LangCode;
      const opts = TITLES_BY_LANG[l] ?? [];
      const current = this.form.controls.title.value as TitleValue | '';

    // si la valeur actuelle n'est pas disponible dans la nouvelle langue, on prend la 1ʳᵉ
    if (!opts.some(o => o.value === current)) {
      this.form.controls.title.setValue(opts[0]?.value ?? '');
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

  get titleOptions() {
    const lang = (this.form.controls.language.value || 'FR') as LangCode;
    return TITLES_BY_LANG[lang] ?? [];
  }


  private computeAge(d: Date): number {
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }

  private loadTownTypology(): void {
    this.http.get('assets/Towns_Typology.csv', { responseType: 'text' })
      .subscribe({
        next: (csv: string) => this.parseTownTypology(csv),
        error: () => {
          this.urbanLevelByCity.clear();
        }
      });
  }

  private parseTownTypology(csvText: string): void {
    this.urbanLevelByCity.clear();
    if (!csvText) return;

    const lines = csvText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    const startIdx = lines[0]?.toLowerCase().startsWith('commune,urbanlevel') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const [commune, levelStr] = lines[i].split(',').map(s => (s ?? '').trim());
      if (!commune) continue;
      const level = Number(levelStr);
      if (!Number.isFinite(level)) continue;
      this.urbanLevelByCity.set(this.normalizeCity(commune), level);
    }
  }

  private normalizeCity(s: string | null | undefined): string {
    return (s ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private lookupUrbanLevel(city: string | null | undefined): number | undefined {
    const key = this.normalizeCity(city);
    return this.urbanLevelByCity.get(key);
  }

  submit() {
    this.result = null;
    this.loading = true;

    const v = this.form.getRawValue();
    const urbanLevel = this.lookupUrbanLevel(v.city);
  
    const payload: BikeBuyerPayload = {
      features: {
        Occupation: v.occupation,
        DivorcedFlag: (Number(v.totalChildren) > 0 && v.maritalStatus === 'S') ? 1 : 0,
        Country: v.country,
        City: v.city,
        Gender: v.gender,
        EducationLevel: v.education,
        UrbanLevel: urbanLevel ?? undefined,
        Age: this.age,
      }
    };

    this.api.predict(payload).subscribe({
      next: r => {
        this.loading = false;
        this.result = { ok: r.isBikeBuyer, percentile: r.percentile, probTrue: r.probTrue, probFalse: r.probFalse };
        const v = this.form.getRawValue();

        const pct = (r.percentile != null)
          ? r.percentile
          : (r.probTrue != null ? Math.round(r.probTrue * 100) : null);

        this.history.add({
          firstName: v.firstName ?? '',
          lastName:  v.lastName ?? '',
          email:     v.emailAddress ?? '',
          isBuyer:   r.isBikeBuyer,
          percentile: pct
        });
      },
      error: () => {
        this.loading = false;
        this.result = { ok: false };
      }
    });
  }
}
