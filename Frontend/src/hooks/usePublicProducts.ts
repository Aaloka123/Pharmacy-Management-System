import { useEffect, useState } from 'react'
import { listNewArrivalsProducts, listPublicProducts, type ProductDto } from '../lib/productsApi'

let cachedProducts: ProductDto[] | null = null
let loadPromise: Promise<ProductDto[]> | null = null
let cachedNewArrivals: ProductDto[] | null = null
let newArrivalsPromise: Promise<ProductDto[]> | null = null

export function invalidatePublicProductsCache() {
  cachedProducts = null
  loadPromise = null
  cachedNewArrivals = null
  newArrivalsPromise = null
}

async function fetchPublicProducts(): Promise<ProductDto[]> {
  if (cachedProducts) return cachedProducts
  if (!loadPromise) {
    loadPromise = listPublicProducts().then((response) => {
      cachedProducts = response.data
      return response.data
    })
  }
  return loadPromise
}

export function usePublicProducts() {
  const [products, setProducts] = useState<ProductDto[]>(cachedProducts ?? [])
  const [loading, setLoading] = useState(cachedProducts == null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchPublicProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Could not load products.')
          console.error(err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { products, loading, error }
}

const byNewest = (a: ProductDto, b: ProductDto) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

async function fetchNewArrivalsFromCatalog(limit: number): Promise<ProductDto[]> {
  const catalog = await fetchPublicProducts()
  return [...catalog].sort(byNewest).slice(0, limit)
}

async function fetchNewArrivals(limit: number): Promise<ProductDto[]> {
  if (cachedNewArrivals) return cachedNewArrivals
  if (!newArrivalsPromise) {
    newArrivalsPromise = (async () => {
      try {
        const response = await listNewArrivalsProducts(limit)
        cachedNewArrivals = response.data
        return response.data
      } catch (err) {
        console.warn('New arrivals endpoint unavailable, using catalog fallback.', err)
        const fallback = await fetchNewArrivalsFromCatalog(limit)
        cachedNewArrivals = fallback
        return fallback
      }
    })()
  }
  return newArrivalsPromise
}

export function useNewArrivals(limit = 4) {
  const [products, setProducts] = useState<ProductDto[]>(cachedNewArrivals ?? [])
  const [loading, setLoading] = useState(cachedNewArrivals == null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchNewArrivals(limit)
      .then((data) => {
        if (!cancelled) {
          setProducts(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError('Could not load new products.')
          console.error(err)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return { products, loading, error }
}
