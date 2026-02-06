import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Asset, AssetAssignment, AssetCondition } from '../models/asset.model';
import { ApiResponse } from '../models/api-response.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/assets`;

  // ============ ASSET CRUD (Admin) ============

  listAssets(query?: string, page = 0, size = 10): Observable<PageResponse<Asset>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query) params = params.set('q', query);
    return this.http
      .get<ApiResponse<PageResponse<Asset>>>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getAsset(id: string): Observable<Asset> {
    return this.http
      .get<ApiResponse<Asset>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createAsset(asset: Partial<Asset>): Observable<Asset> {
    let params = new HttpParams()
      .set('assetTag', asset.assetTag!)
      .set('assetType', asset.assetType!);
    if (asset.brand) params = params.set('brand', asset.brand);
    if (asset.model) params = params.set('model', asset.model);
    if (asset.serialNumber) params = params.set('serialNumber', asset.serialNumber);
    if (asset.purchaseDate) params = params.set('purchaseDate', asset.purchaseDate);
    if (asset.warrantyUntil) params = params.set('warrantyUntil', asset.warrantyUntil);
    if (asset.active !== undefined) params = params.set('active', asset.active);
    if (asset.totalQuantity) params = params.set('totalQuantity', asset.totalQuantity);

    return this.http
      .post<ApiResponse<Asset>>(this.apiUrl, null, { params })
      .pipe(map((response) => response.data));
  }

  updateAsset(id: string, asset: Partial<Asset>): Observable<Asset> {
    let params = new HttpParams();
    if (asset.assetType) params = params.set('assetType', asset.assetType);
    if (asset.brand) params = params.set('brand', asset.brand);
    if (asset.model) params = params.set('model', asset.model);
    if (asset.serialNumber) params = params.set('serialNumber', asset.serialNumber);
    if (asset.purchaseDate) params = params.set('purchaseDate', asset.purchaseDate);
    if (asset.warrantyUntil) params = params.set('warrantyUntil', asset.warrantyUntil);
    if (asset.active !== undefined) params = params.set('active', asset.active);
    if (asset.totalQuantity) params = params.set('totalQuantity', asset.totalQuantity);

    return this.http
      .put<ApiResponse<Asset>>(`${this.apiUrl}/${id}`, null, { params })
      .pipe(map((response) => response.data));
  }

  deleteAsset(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }

  // ============ ASSIGNMENT (Admin) ============

  assignAsset(
    assetId: string,
    userId: string,
    assignedOn?: string,
    condition?: AssetCondition,
    notes?: string,
  ): Observable<AssetAssignment> {
    let params = new HttpParams();
    if (assignedOn) params = params.set('assignedOn', assignedOn);
    if (condition) params = params.set('condition', condition);
    if (notes) params = params.set('notes', notes);

    return this.http
      .post<ApiResponse<AssetAssignment>>(`${this.apiUrl}/${assetId}/assign/${userId}`, null, {
        params,
      })
      .pipe(map((response) => response.data));
  }

  getAssetHistory(assetId: string): Observable<AssetAssignment[]> {
    return this.http
      .get<ApiResponse<AssetAssignment[]>>(`${this.apiUrl}/${assetId}/history`)
      .pipe(map((response) => response.data));
  }

  confirmReturn(
    assignmentId: string,
    returnedOn?: string,
    conditionOnReturn?: AssetCondition,
    notes?: string,
  ): Observable<AssetAssignment> {
    let params = new HttpParams();
    if (returnedOn) params = params.set('returnedOn', returnedOn);
    if (conditionOnReturn) params = params.set('conditionOnReturn', conditionOnReturn);
    if (notes) params = params.set('notes', notes);

    return this.http
      .post<
        ApiResponse<AssetAssignment>
      >(`${this.apiUrl}/assignments/${assignmentId}/confirm-return`, null, { params })
      .pipe(map((response) => response.data));
  }

  // ============ EMPLOYEE SELF-SERVICE ============

  getMyAssets(): Observable<AssetAssignment[]> {
    return this.http
      .get<ApiResponse<AssetAssignment[]>>(`${this.apiUrl}/my-assets`)
      .pipe(map((response) => response.data));
  }

  requestReturn(assignmentId: string): Observable<AssetAssignment> {
    return this.http
      .post<
        ApiResponse<AssetAssignment>
      >(`${this.apiUrl}/assignments/${assignmentId}/request-return`, null)
      .pipe(map((response) => response.data));
  }
}
