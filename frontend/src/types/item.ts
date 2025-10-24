export interface Item {
  id: number
  name: string
  description?: string
  imageUrl?: string
  price?: number
  link?: string
  category?: string
  status: 'to_buy' | 'wishlist' | 'purchased'
  priority: 'urgent' | 'normal' | 'low'
  notes?: string
  rating?: number
  userId: number
  createdAt: string
  updatedAt: string
}

export interface CreateItemDto {
  name: string
  description?: string
  imageUrl?: string
  price?: number
  link?: string
  category?: string
  status?: 'to_buy' | 'wishlist' | 'purchased'
  priority?: 'urgent' | 'normal' | 'low'
  notes?: string
  rating?: number
}

export interface UpdateItemDto extends Partial<CreateItemDto> {}
