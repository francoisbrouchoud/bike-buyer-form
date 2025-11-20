import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RandomCustomerService {
  private firstNames = ['Marie', 'Paul', 'Lucas', 'Emma', 'Léa', 'Noah', 'Sophie', 'Jonas'];
  private lastNames  = ['Durand', 'Meyer', 'Dubois', 'Schmidt', 'Rossi', 'Martin', 'Bernard', 'Lambert'];

  private streets = [
    'Rue du Lac', 'Avenue de la Gare', 'Rue Centrale',
    'Chemin des Vignes', 'Rue de l’Eglise', 'Chemin du Stade'
  ];

  private cities = [
    { zip: '1950', city: 'Sion',      state: 'VS' },
    { zip: '1890', city: 'St-Maurice', state: 'VS' },
    { zip : '1090', city: 'La Croix (Lutry)',  state: 'VD' },
    { zip: '2000', city: 'Neuchâtel',   state: 'NE' },
    { zip: '8000', city: 'Zürich',    state: 'ZH' }
  ];

  private emailDomains = ['example.com', 'mail.com', 'demo.ch', 'test.org'];

   private pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private int(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }

  private randomBirthDateString(minAge = 18, maxAge = 75): string {
    const today = new Date();
    const age = this.int(minAge, maxAge);
    const year = today.getFullYear() - age;
    const month = this.int(1, 12);
    const day = this.int(1, 28);

    const dd = day.toString().padStart(2, '0');
    const mm = month.toString().padStart(2, '0');
    const yyyy = year.toString();

    return `${dd}.${mm}.${yyyy}`;
  }

  private buildEmail(firstName: string, lastName: string): string {
    const slug = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
    const f = slug(firstName || 'user');
    const l = slug(lastName || 'demo');
    const domain = this.pick(this.emailDomains);
    return `${f}.${l}@${domain}`;
  }

  generate(): Record<string, unknown> {
    const language = 'FR';
    const gender = this.pick(['M', 'F'] as const);
    const title = gender === 'M' ? 'Monsieur' : 'Madame';

    const firstName = this.pick(this.firstNames);
    const lastName  = this.pick(this.lastNames);

    const totalChildren = this.int(0, 3);
    const totalChildrenAtHome = this.int(0, totalChildren);

    const maritalStatus = this.pick(['M', 'S'] as const);

    const cityObj = this.pick(this.cities);
    const educationLevel = this.int(1, 5);

    const yearlyIncomeValues = [
      '0-40000',
      '40001-70000',
      '70001-90000',
      '90001-120000',
      'greater than 120000'
    ] as const;

    const occupationValues = [
      'Professional',
      'Skilled Manual',
      'Management',
      'Clerical',
      'Manual'
    ] as const;

    return {
      language,
      title,
      firstName,
      lastName,
      gender,
      birthDate: this.randomBirthDateString(),
      height: this.int(155, 190),
      maritalStatus,
      emailAddress: this.buildEmail(firstName, lastName),
      phoneNumber: `+41 ${this.int(210000000, 799999999)}`,
      emailPromotion: this.int(0, 2),
      country: 'CH',
      zip: cityObj.zip,
      city: cityObj.city,
      street: `${this.pick(this.streets)} ${this.int(1, 40)}`,
      state: cityObj.state,
      yearlyIncome: this.pick(yearlyIncomeValues),
      homeOwner: Math.random() < 0.5,
      numberCarsOwned: this.int(0, 3),
      totalChildren,
      totalChildrenAtHome,
      education: educationLevel,
      occupation: this.pick(occupationValues),
    };
  }
}
