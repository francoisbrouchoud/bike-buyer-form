import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';

type GAResult = { attrs?: { detail?: string; label?: string; origin?: string } };
type GASearchResponse = { results?: GAResult[] };

function stripTags(s: string) {
    return s.replace(/<[^>]*>/g, '');
}

@Injectable({ providedIn: 'root' })
export class GeoAdminService {
    private http = inject(HttpClient);
    private base = 'https://api3.geo.admin.ch/rest/services/api/SearchServer';

    searchZipLocalities(zip: string): Observable<Array<{ zip: string; city: string; canton?: string }>> {
        const query = (zip ?? '').toString().trim();
        if (query.length < 3) return of([]);

        const url = `${this.base}?type=locations&origins=zipcode&limit=20&searchText=${encodeURIComponent(query)}`;

        return this.http.get<GASearchResponse>(url).pipe(
            map(r => r.results ?? []),
            map(list => list
                .map(it => it.attrs ?? {})
                .map(a => {
                    // Texte brut (sans balises)
                    const raw = stripTags(a.label ?? a.detail ?? '').trim();

                    // 1) zip: premier 4 chiffres trouvés, sinon la saisie
                    const zipMatch = raw.match(/\b(\d{4})\b/);
                    const zipStr = zipMatch?.[1] ?? query;

                    // 2) city+canton: on supprime tout avant/including le CP, puis le canton éventuel entre () ou en suffixe
                    let cityPart = raw.replace(/^[^\d]*(\d{4})\s*/, ''); // enlève le préfixe jusqu'au CP
                    // supprime un éventuel préfixe '-', '–', '—', '•' et espaces
                    cityPart = cityPart.replace(/^\s*[-–—•]\s*/, '').trim();

                    // canton entre parenthèses: "(VS)"
                    let canton = (cityPart.match(/\(([A-Z]{2})\)/) || [])[1];
                    cityPart = cityPart.replace(/\s*\(([A-Z]{2})\)\s*$/, '').trim();

                    // sinon, canton en suffixe sans parenthèses: "Mex VS"
                    if (!canton) {
                        const m = cityPart.match(/\s([A-Z]{2})$/);
                        if (m) {
                            canton = m[1];
                            cityPart = cityPart.replace(/\s[A-Z]{2}$/, '').trim();
                        }
                    }

                    // city final, propre
                    const city = cityPart.replace(/^\s*[-–—•]\s*/, '').trim();

                    return { zip: zipStr, city, canton };
                })
                .filter(x => !!x.city)
            )
        );
    }

    searchAddresses(
        streetLike: string,
        city: string
    ): Observable<Array<{ street: string; canton?: string; zip?: string; city?: string }>> {
        const s = (streetLike ?? '').toString().trim();
        const c = (city ?? '').toString().trim();
        if (!s || !c) return of([]);

        const q = `${s} ${c}`.trim();
        const url = `${this.base}?type=locations&origins=address&limit=20&searchText=${encodeURIComponent(q)}`;

        const clean = (t: string) => t.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

        const extractStreet = (raw: string) => {
            const idx = raw.indexOf(',');
            if (idx > -1) return raw.slice(0, idx).trim();
            const mZip = raw.match(/\b(\d{4})\b/);
            if (mZip) return raw.slice(0, raw.indexOf(mZip[0])).trim();
            const mSimple = raw.match(/^(.+?\d+[a-zA-Z]?)\b/);
            if (mSimple) return mSimple[1].trim();
            return raw;
        };

        const extractZipCityCanton = (raw: string) => {
            const zip = (raw.match(/\b(\d{4})\b/) || [])[1];
            let cityPart = raw;
            if (zip) cityPart = raw.slice(raw.indexOf(zip) + zip.length).trim();

            let canton = (cityPart.match(/\(([A-Z]{2})\)/) || [])[1];
            if (canton) cityPart = cityPart.replace(/\s*\(([A-Z]{2})\)\s*$/, '').trim();

            if (!canton) {
                const suf = cityPart.match(/\s([A-Z]{2})$/);
                if (suf) {
                    canton = suf[1];
                    cityPart = cityPart.replace(/\s[A-Z]{2}$/, '').trim();
                }
            }
            if (!canton) {
                const low = raw.toLowerCase().match(/\bch\s+([a-z]{2})\b/);
                if (low) canton = low[1].toUpperCase();
            }

            const city = cityPart.replace(/^\s*[-–—•]\s*/, '').trim();
            return { zip, city, canton };
        };

        return this.http.get<GASearchResponse>(url).pipe(
            map(r => r.results ?? []),
            map(list => list
                .map(it => it.attrs ?? {})
                .map(a => {
                    const rawLabel = clean(a.label || '');
                    const rawDetail = clean(a.detail || '');
                    const base = rawLabel || rawDetail;
                    const street = extractStreet(base);

                    const { zip, city: outCity, canton } =
                        extractZipCityCanton(rawDetail || base);

                    return { street, zip, city: outCity, canton };
                })
                .filter(s => !!s.street)
            )

        );
    }

}
