import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePublicProducts } from '../hooks/usePublicProducts'
import { pickProductCards, type ProductCard, type ShowcaseSort } from '../lib/productCard'

type ProductShowcaseSectionProps = {
  title: string
  sort: ShowcaseSort
}

const ProductCardLink = ({ product }: { product: ProductCard }) => (
  <Link
    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
    to={`/productsdetail?id=${product.id}`}
  >
    {product.image ? (
      <img alt={product.name} className="h-48 w-full bg-white p-2 object-contain" src={product.image} />
    ) : (
      <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-400" />
    )}
    <div className="p-4">
      <h3 className="text-base font-bold text-slate-900">{product.name}</h3>
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

const ProductShowcaseSection = ({ title, sort }: ProductShowcaseSectionProps) => {
  const { products, loading, error } = usePublicProducts()
  const cards = useMemo(() => pickProductCards(products, sort, 4), [products, sort])

  return (
    <section className="bg-white px-4 py-14 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <Link
            className="text-sm font-semibold italic text-slate-900 underline underline-offset-2 transition hover:text-teal-700"
            to="/products"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading products...</p>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!loading && !error && cards.length === 0 ? (
          <p className="text-sm text-slate-500">No products available yet.</p>
        ) : null}

        {!loading && cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
