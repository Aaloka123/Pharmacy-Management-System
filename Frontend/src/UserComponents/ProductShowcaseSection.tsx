import { useEffect, useMemo, useState } from 'react'
import { HiOutlineArrowRight } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import { useNewArrivals, usePublicProducts } from '../hooks/usePublicProducts'
import { mapDtoToCard, pickProductCards, type ProductCard, type ShowcaseSort } from '../lib/productCard'

const VISIBLE_COUNT = 4

type ProductShowcaseSectionProps = {
  title: string
  sort?: ShowcaseSort
  /** Latest vendor listings from DB (newest first); ignores `sort`. */
  onlyNewArrivals?: boolean
  /** When set, cycles visible products every N milliseconds. */
  rotateIntervalMs?: number
}

const ProductCardLink = ({ product }: { product: ProductCard }) => (
  <Link
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
    to={`/productsdetail?id=${product.id}`}
  >
    {product.image ? (
      <img alt={product.name} className="h-48 w-full bg-white p-2 object-contain" src={product.image} />
    ) : (
      <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
        No image
      </div>
    )}
    <div className="p-4">
      <h3 className="text-base font-bold text-slate-900">{product.name}</h3>
      {product.vendorName ? (
        <p className="mt-1 text-xs text-slate-500">
          By{' '}
          <span className="font-bold text-slate-900">{product.vendorName}</span>
        </p>
      ) : null}
      <p className="mt-2 text-lg font-bold text-teal-700">{product.price}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <p className="uppercase tracking-wide text-slate-400">Strength</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{product.strength}</p>
        </div>
        <div>
          <p className="uppercase tracking-wide text-slate-400">Form</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{product.form}</p>
        </div>
        <div>
          <p className="uppercase tracking-wide text-slate-400">Quantity</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{product.quantity}</p>
        </div>
      </div>
    </div>
  </Link>
)

function visibleWindow(allCards: ProductCard[], offset: number): ProductCard[] {
  if (allCards.length <= VISIBLE_COUNT) return allCards
  const slice: ProductCard[] = []
  for (let i = 0; i < VISIBLE_COUNT; i += 1) {
    slice.push(allCards[(offset + i) % allCards.length])
  }
  return slice
}

const ProductShowcaseSection = ({
  title,
  sort = 'newest',
  onlyNewArrivals = false,
  rotateIntervalMs,
}: ProductShowcaseSectionProps) => {
  const catalog = usePublicProducts()
  const newArrivals = useNewArrivals(VISIBLE_COUNT)
  const { products, loading, error } = onlyNewArrivals ? newArrivals : catalog
  const poolLimit = rotateIntervalMs ? Math.max(products.length, VISIBLE_COUNT) : VISIBLE_COUNT
  const allCards = useMemo(() => {
    if (onlyNewArrivals) {
      return products.map((dto) => mapDtoToCard(dto, { includeVendor: true }))
    }
    return pickProductCards(products, sort, poolLimit)
  }, [onlyNewArrivals, products, sort, poolLimit])
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setOffset(0)
  }, [products, sort])

  useEffect(() => {
    if (!rotateIntervalMs || allCards.length <= VISIBLE_COUNT) return undefined
    const id = window.setInterval(() => {
      setOffset((prev) => (prev + VISIBLE_COUNT) % allCards.length)
    }, rotateIntervalMs)
    return () => window.clearInterval(id)
  }, [rotateIntervalMs, allCards.length])

  const cards = useMemo(
    () => (rotateIntervalMs ? visibleWindow(allCards, offset) : allCards.slice(0, VISIBLE_COUNT)),
    [allCards, offset, rotateIntervalMs],
  )

  return (
    <section className="bg-white px-4 py-14 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <Link
            className="group inline-flex cursor-pointer whitespace-nowrap text-sm font-medium text-slate-600 transition hover:text-teal-700"
            to="/products"
          >
            <span className="inline-flex items-center gap-1.5 border-b border-slate-300 pb-0.5 transition group-hover:border-teal-600">
              View All
              <HiOutlineArrowRight
                aria-hidden
                className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading products...</p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!loading && !error && cards.length === 0 ? (
          <p className="text-sm text-slate-500">
            {onlyNewArrivals ? 'No new products from vendors yet.' : 'No products available yet.'}
          </p>
        ) : null}

        {!loading && cards.length > 0 ? (
          <div
            className="grid grid-cols-1 gap-6 transition-opacity duration-500 sm:grid-cols-2 lg:grid-cols-4"
            key={rotateIntervalMs ? offset : 'static'}
          >
            {cards.map((product) => (
              <ProductCardLink key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ProductShowcaseSection
