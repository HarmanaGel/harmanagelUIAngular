import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Guid } from 'guid-typescript';
import {
  AuctionDto,
  CreateAuctionDto,
  UpdateAuctionDto,
  PlaceBidDto,
  AuctionBidDto,
  AuctionDetailDto,
  GetAuctionsInputDto,
  GetAuctionBidsInputDto,
  GetUserAuctionsInputDto,
  PagedResultDto,
  AuctionSummaryDto
} from '../../shared/models/auction.model';

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private readonly apiUrl = `${environment.apiUrl}/api/app/auction`;

  constructor(private http: HttpClient) {}

  // CRUD Operations
  create(input: CreateAuctionDto): Observable<AuctionDto> {
    input.productId = Guid.create().toString();
    return this.http.post<AuctionDto>(`${this.apiUrl}`, input);
  }

  update(id: string, input: UpdateAuctionDto): Observable<AuctionDto> {
    return this.http.put<AuctionDto>(`${this.apiUrl}/${id}`, input);
  }

  get(id: string): Observable<AuctionDto> {
    return this.http.get<AuctionDto>(`${this.apiUrl}/${id}`);
  }

  getList(input?: GetAuctionsInputDto): Observable<PagedResultDto<AuctionDto>> {
    let params = new HttpParams();

    if (input) {
      if (input.skipCount !== undefined) {
        params = params.set('SkipCount', input.skipCount.toString());
      }
      if (input.maxResultCount !== undefined) {
        params = params.set('MaxResultCount', input.maxResultCount.toString());
      }
      if (input.filter) {
        params = params.set('Filter', input.filter);
      }
      if (input.status !== undefined) {
        params = params.set('Status', input.status.toString());
      }
      if (input.productType !== undefined) {
        params = params.set('ProductType', input.productType.toString());
      }
      if (input.sorting) {
        params = params.set('Sorting', input.sorting);
      }
    }

    return this.http.get<PagedResultDto<AuctionDto>>(`${this.apiUrl}`, { params });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Admin Operations
  approve(id: string): Observable<AuctionDto> {
    return this.http.post<AuctionDto>(`${this.apiUrl}/${id}/approve`, {});
  }

  cancel(id: string): Observable<AuctionDto> {
    return this.http.post<AuctionDto>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getPendingApprovals(input?: GetAuctionsInputDto): Observable<PagedResultDto<AuctionDto>> {
    let params = new HttpParams();

    if (input) {
      if (input.skipCount !== undefined) {
        params = params.set('SkipCount', input.skipCount.toString());
      }
      if (input.maxResultCount !== undefined) {
        params = params.set('MaxResultCount', input.maxResultCount.toString());
      }
      if (input.filter) {
        params = params.set('Filter', input.filter);
      }
    }

    return this.http.get<PagedResultDto<AuctionDto>>(`${this.apiUrl}/pending-approvals`, { params });
  }

  // Bid Operations
  placeBid(input: PlaceBidDto): Observable<AuctionBidDto> {
    return this.http.post<AuctionBidDto>(`${this.apiUrl}/place-bid`, input);
  }

  getBids(input: GetAuctionBidsInputDto): Observable<PagedResultDto<AuctionBidDto>> {
    let params = new HttpParams()
      .set('AuctionId', input.auctionId);

    if (input.skipCount !== undefined) {
      params = params.set('SkipCount', input.skipCount.toString());
    }
    if (input.maxResultCount !== undefined) {
      params = params.set('MaxResultCount', input.maxResultCount.toString());
    }

    return this.http.get<PagedResultDto<AuctionBidDto>>(`${this.apiUrl}/bids`, { params });
  }

  // User Operations
  getUserParticipatedAuctions(input?: GetUserAuctionsInputDto): Observable<PagedResultDto<AuctionDto>> {
    let params = new HttpParams();

    if (input) {
      if (input.skipCount !== undefined) {
        params = params.set('SkipCount', input.skipCount.toString());
      }
      if (input.maxResultCount !== undefined) {
        params = params.set('MaxResultCount', input.maxResultCount.toString());
      }
      if (input.filter) {
        params = params.set('Filter', input.filter);
      }
      if (input.participatedOnly !== undefined) {
        params = params.set('ParticipatedOnly', input.participatedOnly.toString());
      }
    }

    return this.http.get<PagedResultDto<AuctionDto>>(`${this.apiUrl}/user-participated`, { params });
  }

  getDetail(id: string): Observable<AuctionDetailDto> {
    return this.http.get<AuctionDetailDto>(`${this.apiUrl}/${id}/detail`);
  }

  // Utility methods
  getAuctionSummaries(): Observable<AuctionSummaryDto[]> {
    return this.http.get<AuctionSummaryDto[]>(`${this.apiUrl}/summaries`);
  }
}
