export interface TrackedItem {
  id: string
  userId: string
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  productUrl: string
  sku?: string
  currentPrice: number
  currency: string
  targetPrice?: number
  category?: string
  notes?: string
  isTracking: boolean
  status: 'tracking' | 'paused' | 'purchased'
  lastCheckedAt: string
  createdAt: string
  updatedAt: string
  store?: {
    id: string
    name: string
    domain: string
    logoUrl?: string
    brandColor?: string
  }
}

export interface PreviewItemDto {
  productUrl: string
}

export interface PreviewItemResponse {
  store: {
    id: string
    name: string
    domain: string
  }
  product: {
    title?: string
    price: number
    currency: string
    imageUrl?: string
    sku?: string
    isAvailable: boolean
  }
  url: string
}

export interface CreateTrackedItemDto {
  productUrl: string
  name?: string
  storeId?: string
  targetPrice?: number
  category?: string
  notes?: string
  isTracking?: boolean
}

export interface UpdateTrackedItemDto extends Partial<CreateTrackedItemDto> {}
