import type { ProductDto } from './productsApi'
import { getFirstProductImageUrl } from './productsApi'

export type ProductCard = {
  id: number
  name: string
  price: string
  strength: string
  form: string
  quantity: string
  image: string | null
  vendorName?: string
}

export type ShowcaseSort = 'newest' | 'topStock' | 'suggested'

const byNewest = (a: ProductDto, b: ProductDto) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

export function mapDtoToCard(dto: ProductDto, options?: { includeVendor?: boolean }): ProductCard {
  return {
    id: dto.id,
    name: dto.productName,
    price: `NRP ${Number(dto.price).toLocaleString()}`,
    strength: dto.strength,
    form: dto.form,
    quantity: dto.quantity,
    image: getFirstProductImageUrl(dto.images),
    vendorName: options?.includeVendor ? dto.vendorBusinessName : undefined,
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

  // Prefer in-stock items not already in "New Arrivals", then fill up to 4 so the row stays full.
  const newestIds = new Set(
    [...products].sort(byNewest).slice(0, limit).map((product) => product.id),
  )
  const inStock = [...products].filter((product) => product.stock > 0)
  const primary = inStock
    .filter((product) => !newestIds.has(product.id))
    .sort((a, b) => Number(a.price) - Number(b.price))
  const picked: ProductDto[] = []
  const pickedIds = new Set<number>()
  for (const product of primary) {
    if (picked.length >= limit) break
    picked.push(product)
    pickedIds.add(product.id)
  }
  if (picked.length < limit) {
    const rest = inStock
      .filter((product) => !pickedIds.has(product.id))
      .sort((a, b) => Number(a.price) - Number(b.price))
    for (const product of rest) {
      if (picked.length >= limit) break
      picked.push(product)
    }
  }
  return picked.map(mapDtoToCard)
}
