import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateWebTransactionRequest,
  TransactionCategoryOption,
  UpdateWebTransactionRequest,
  WebTransactionResponse,
} from './models/transaction.models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/transactions`;

  getCategories(): Observable<TransactionCategoryOption[]> {
    return this.http.get<TransactionCategoryOption[]>(`${this.baseUrl}/categories`);
  }

  createExpense(body: CreateWebTransactionRequest): Observable<WebTransactionResponse> {
    return this.http.post<WebTransactionResponse>(`${this.baseUrl}/expenses`, body);
  }

  createIncome(body: CreateWebTransactionRequest): Observable<WebTransactionResponse> {
    return this.http.post<WebTransactionResponse>(`${this.baseUrl}/income`, body);
  }

  update(id: string, body: UpdateWebTransactionRequest): Observable<WebTransactionResponse> {
    return this.http.put<WebTransactionResponse>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
