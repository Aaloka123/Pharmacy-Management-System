import { resolveBackendUrl } from './api'
import type { ProductDto } from './productsApi'
import placeholderImage from '../assets/Paracetamol.jpg'

export type ProductCard = {
  id: number
  name: string
  price: string
  strength: string
  form: string
  quantity: string
  image: string
}

export type ShowcaseSort = 'newest' | 'topStock' | 'suggested'

const byNewest = (a: ProductDto, b: ProductDto) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

export function mapDtoToCard(dto: ProductDto): ProductCard {
  const image =
    dto.images.length > 0 ? resolveBackendUrl(dto.images[0]) : placeholderImage
  return {
    id: dto.id,
    name: dto.productName,
    price: `NRP ${Number(dto.price).toLocaleString()}`,
    strength: dto.strength,
    form: dto.form,
    quantity: dto.quantity,
    image,
  }
}

export function pickProductCards(
  products: ProductDto[],
  sort: ShowcaseSort,
  limit = 4,
): ProductCard[] {
  if (products.length === 0) return []

  if (sort === 'newest') {
    return [...products].sort(byNewest).slice(0, limit).map(mapDtoToCard)
  }

  if (sort === 'topStock') {
    return [...products]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, limit)
      .map(mapDtoToCard)
  }

  const newestIds = new Set(
    [...products].sort(byNewest).slice(0, limit).map((product) => product.id),
  )
  return [...products]
    .filter((product) => product.stock > 0 && !newestIds.has(product.id))
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, limit)
    .map(mapDtoToCard)
}
