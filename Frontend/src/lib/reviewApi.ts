import { api, resolveMediaUrl, resolveProfileImageUrl } from './api'
import type { AuthUser } from './auth'

export type ReviewDto = {
  id: number
  productId: number
  authorId: number
  productName: string
  author: string
  authorProfileImage: string | null
  body: string
  rating: number
  likes: number
  likedByMe: boolean
  imageUrl: string | null
  createdAt: string
}

function mapReviewDto(review: ReviewDto): ReviewDto {
  return {
    ...review,
    authorProfileImage: resolveProfileImageUrl(review.authorProfileImage),
    imageUrl: review.imageUrl ? resolveMediaUrl(review.imageUrl) : null,
  }
}

export function resolveReviewAuthorAvatar(
  review: ReviewDto,
  currentUser: AuthUser | null | undefined,
): string | null {
  if (review.authorProfileImage) {
    return review.authorProfileImage
  }
  if (currentUser && review.authorId === currentUser.id) {
    return resolveProfileImageUrl(currentUser.profileImage)
  }
  return null
}

export type ProductReviewsDto = {
  reviews: ReviewDto[]
  averageRating: number
  totalReviews: number
}

export type ReviewEligibilityDto = {
  canReview: boolean
  message: string | null
}

export async function fetchProductReviews(productId: number): Promise<ProductReviewsDto> {
  const { data } = await api.get<ProductReviewsDto>(`/api/products/${productId}/reviews`)
  return {
    ...data,
    reviews: data.reviews.map(mapReviewDto),
  }
}

export async function fetchReviewEligibility(productId: number): Promise<ReviewEligibilityDto> {
  const { data } = await api.get<ReviewEligibilityDto>(`/api/products/${productId}/reviews/eligibility`)
  return data
}

export async function submitProductReview(
  productId: number,
  rating: number,
  body: string,
  image?: File | null,
): Promise<ReviewDto> {
  const form = new FormData()
  form.append(
    'review',
    new Blob([JSON.stringify({ rating, body })], { type: 'application/json' }),
  )
  if (image) {
    form.append('image', image)
  }
  const { data } = await api.post<ReviewDto>(`/api/products/${productId}/reviews`, form)
  return mapReviewDto(data)
}

export async function toggleReviewLike(reviewId: number): Promise<ReviewDto> {
  const { data } = await api.post<ReviewDto>(`/api/reviews/${reviewId}/like`)
  return mapReviewDto(data)
}

export async function fetchVendorReviews(): Promise<ReviewDto[]> {
  const { data } = await api.get<ReviewDto[]>('/api/vendor/reviews')
  return data.map(mapReviewDto)
}
