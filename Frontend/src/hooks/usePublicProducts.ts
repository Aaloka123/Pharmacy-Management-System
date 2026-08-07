import { useCallback, useEffect, useState } from 'react'
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

async function fetchPublicProducts(force = false): Promise<ProductDto[]> {
  if (!force && cachedProducts) return cachedProducts
  if (force) {
    loadPromise = null
    cachedProducts = null
  }
  if (!loadPromise) {
    loadPromise = listPublicProducts()
      .then((response) => {
        const data = Array.isArray(response.data) ? response.data : []
        cachedProducts = data
        return data
      })
      .catch((err) => {
        // Allow a later retry instead of keeping a permanently rejected promise.
        loadPromise = null
        throw err
      })
  }
  return loadPromise
}

export function usePublicProducts() {
  const [products, setProducts] = useState<ProductDto[]>(cachedProducts ?? [])
  const [loading, setLoading] = useState(cachedProducts == null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    try {
      const data = await fetchPublicProducts(force)
      setProducts(data)
      setError(null)
      return data
    } catch (err) {
      setError('Could not load products.')
      console.error(err)
      return [] as ProductDto[]
    } finally {
      setLoading(false)
    }
  }, [])

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

  return { products, loading, error, reload: () => load(true) }
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
        const data = Array.isArray(response.data) ? response.data : []
        cachedNewArrivals = data
        return data
      } catch (err) {
        console.warn('New arrivals endpoint unavailable, using catalog fallback.', err)
        const fallback = await fetchNewArrivalsFromCatalog(limit)
        cachedNewArrivals = fallback
        return fallback
      }
    })().catch((err) => {
      newArrivalsPromise = null
      throw err
    })
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
