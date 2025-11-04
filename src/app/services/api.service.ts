import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface BikeBuyerPayload {
  features: Record<string, unknown>;
}

export interface PredictionApiResponse {
  result: {
    prediction: string | boolean | number;
    probaPercentile?: number;
    probas?: Record<string, number>; 
    ignored?: boolean;
  };
}

export interface BikeBuyerResult {
  isBikeBuyer: boolean;
  percentile?: number;
  probTrue?: number;
  probFalse?: number;
  raw: PredictionApiResponse;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private ML_API_URL =
    'https://dss.ga-fl.net/public/api/v1/EAD_ZALAXUS_01_PredictBikeBuyer/EAD_ZALAXUS_01_PredictBikeBuyer/predict';

  predict(payload: BikeBuyerPayload): Observable<BikeBuyerResult> {
    return this.http.post<PredictionApiResponse>(this.ML_API_URL, payload).pipe(
      map(res => {
        const pred = res?.result?.prediction;

        const isBuyer =
          typeof pred === 'boolean' ? pred :
          typeof pred === 'string'  ? (pred.toLowerCase() === 'true' || pred === '1') :
          typeof pred === 'number'  ? pred === 1 : false;

        const percentile = res?.result?.probaPercentile ?? undefined;

        let probTrue: number | undefined;
        const p = res?.result?.probas;
        if (p) {
          probTrue = p['true'] ?? p['1'];
          if (probTrue === undefined) {
            const key = Object.keys(p).find(k => k.toLowerCase() === 'true' || k === '1');
            if (key) probTrue = p[key];
          }
        }

        let probFalse: number | undefined;
        if (p) {
          probFalse = p['false'] ?? p['0'];
          if (probFalse === undefined) {
            const key = Object.keys(p).find(k => k.toLowerCase() === 'false' || k === '0');
            if (key) probFalse = p[key];
          }
        }

        return { isBikeBuyer: isBuyer, percentile, probTrue, probFalse, raw: res };
      })
    );
  }
}
