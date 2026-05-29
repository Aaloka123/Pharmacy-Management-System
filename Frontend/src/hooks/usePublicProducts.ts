import { useEffect, useState } from 'react'
import { listPublicProducts, type ProductDto } from '../lib/productsApi'

let cachedProducts: ProductDto[] | null = null
let loadPromise: Promise<ProductDto[]> | null = null

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
