export interface AuctionDto {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  minimumBidIncrement: number;
  startTime: Date;
  endTime: Date;
  autoExtensionMinutes: number;
  status: AuctionStatus;
  productType: AuctionProductType;
  productId: string;
  isApproved: boolean;
  approvedTime?: Date;
  approvedBy?: string;
  totalBids: number;
  winningBidId?: string;
  creationTime: Date;
  creatorId?: string;
  lastModificationTime?: Date;
  lastModifierId?: string;
}

export interface CreateAuctionDto {
  title: string;
  description: string;
  startingPrice: number;
  minimumBidIncrement: number;
  startTime: Date;
  endTime: Date;
  autoExtensionMinutes: number;
  productType: AuctionProductType;
  productId: string;
}

export interface UpdateAuctionDto {
  title: string;
  description: string;
  startingPrice: number;
  minimumBidIncrement: number;
  startTime: Date;
  endTime: Date;
  autoExtensionMinutes: number;
}

export interface PlaceBidDto {
  auctionId: string;
  bidAmount: number;
  notes?: string;
}

export interface AuctionBidDto {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderUserName: string;
  bidAmount: number;
  bidTime: Date;
  isWinningBid: boolean;
  isAutoBid: boolean;
  notes?: string;
}

export interface AuctionDetailDto {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  minimumBidIncrement: number;
  startTime: Date;
  endTime: Date;
  autoExtensionMinutes: number;
  status: AuctionStatus;
  productType: AuctionProductType;
  productId: string;
  winningBidId?: string;
  isApproved: boolean;
  totalBids: number;
  isActive: boolean;
  isExpired: boolean;
  remainingSeconds?: number;
  recentBids: AuctionBidDto[];
  highestBid?: AuctionBidDto;
  currentUserHighestBid?: AuctionBidDto;
  creationTime: Date;
  creatorId?: string;
  lastModificationTime?: Date;
  lastModifierId?: string;
}

export interface GetAuctionsInputDto {
  skipCount?: number;
  maxResultCount?: number;
  filter?: string;
  status?: AuctionStatus;
  productType?: AuctionProductType;
  sorting?: string;
}

export interface GetAuctionBidsInputDto {
  auctionId: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface GetUserAuctionsInputDto {
  skipCount?: number;
  maxResultCount?: number;
  filter?: string;
  participatedOnly?: boolean;
}

export enum AuctionStatus {
  Draft = 0,
  Pending = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
  Paused = 5
}

export enum AuctionProductType {
  Animal = 0,
  OrganicProduct = 1
}

export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface AuctionSummaryDto {
  id: string;
  title: string;
  currentPrice: number;
  endTime: Date;
  status: AuctionStatus;
  totalBids: number;
  imageUrl?: string;
}
