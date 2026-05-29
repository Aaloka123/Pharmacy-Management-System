import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addToCart } from '../lib/cartStorage'
import { resolveBackendUrl } from '../lib/api'
import { listPublicProducts, type ProductDto } from '../lib/productsApi'
import placeholderImage from '../assets/Paracetamol.jpg'

const ALL_CATEGORY = 'All Medications'

type CatalogProduct = {
  id: number
  name: string
  category: string
  subtitle: string
  strength: string
  form: string
  quantity: string
  price: number
  stock: number
  stockLabel: string
  stockTone: string
  image: string
}

const stockDisplay = (stock: number) => {
  if (stock <= 0) {
    return { stockLabel: 'Out of Stock', stockTone: 'bg-slate-100 text-slate-600' }
  }
  if (stock <= 10) {
    return { stockLabel: 'Low Stock', stockTone: 'bg-rose-100 text-rose-700' }
  }
  return { stockLabel: 'In Stock', stockTone: 'bg-emerald-100 text-emerald-700' }
}

const mapProduct = (dto: ProductDto): CatalogProduct => {
  const stock = stockDisplay(dto.stock)
  const imageUrl =
    dto.images.length > 0 ? resolveBackendUrl(dto.images[0]) : placeholderImage
  return {
    id: dto.id,
    name: dto.productName,
    category: dto.category,
    subtitle: `${dto.category} · ${dto.form}`,
    strength: dto.strength,
    form: dto.form,
    quantity: dto.quantity,
    price: Number(dto.price),
    stock: dto.stock,
    stockLabel: stock.stockLabel,
    stockTone: stock.stockTone,
    image: imageUrl,
  }
}

const Products = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY)
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const { data } = await listPublicProducts()
        if (!cancelled) {
          setProducts(data.map(mapProduct))
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError('Could not load products. Is the backend running?')
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).sort()
    return [ALL_CATEGORY, ...unique]
  }, [products])

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory = selectedCategory === ALL_CATEGORY || product.category === selectedCategory
      return matchesCategory
    })

    const sorted = [...filtered]
    if (sortBy === 'price-low-high') sorted.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-high-low') sorted.sort((a, b) => b.price - a.price)
    if (sortBy === 'name-a-z') sorted.sort((a, b) => a.name.localeCompare(b.name))
    return sorted
  }, [products, selectedCategory, sortBy])

  return (
    <div className="bg-white">
      <Header />
      <main className="bg-white px-[80px] pb-10 pt-4">
        <section className="w-full bg-white p-2 md:p-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-slate-900">Product</h1>
              <p className="mt-3 text-sm text-slate-600 md:text-base">Browse trusted medicines.</p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white">
            New Prescription
            </button>
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    selectedCategory === category ? 'border border-teal-600 bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-700'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-[280px_1fr]">
            <aside className="h-fit rounded-3xl bg-slate-100 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-teal-500"
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    value={selectedCategory}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Sort By</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-teal-500"
                    onChange={(event) => setSortBy(event.target.value)}
                    value={sortBy}
                  >
                    <option value="default">Default</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                    <option value="name-a-z">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </aside>

            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <p className="col-span-full text-sm text-slate-500">Loading products...</p>
              ) : null}
              {loadError ? (
                <p className="col-span-full text-sm text-rose-600">{loadError}</p>
              ) : null}
              {!loading && !loadError && filteredProducts.length === 0 ? (
                <p className="col-span-full text-sm text-slate-500">No products available yet.</p>
              ) : null}
              {filteredProducts.map((product) => (
              <article
                className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                key={product.id}
                onClick={() => navigate(`/productsdetail?id=${product.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/productsdetail?id=${product.id}`)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="relative h-56 w-full bg-white">
                  {product.image ? <img alt={product.name} className="h-full w-full object-contain bg-white p-2" src={product.image} /> : null}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] uppercase ${product.stockTone}`}
                    style={{ fontWeight: 600 }}
                  >
                    {product.stockLabel}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{product.subtitle}</p>
                  <p className="mt-1 text-base font-bold text-teal-700">NRP {product.price.toLocaleString()}</p>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Strength</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">{product.strength}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Form</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">{product.form}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">Quantity</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">{product.quantity}</p>
                    </div>
                  </div>
                  <button
                    className="mt-2 flex w-full items-center justify-center rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={product.stock <= 0}
                    onClick={(event) => {
                      event.stopPropagation()
                      addToCart({
                        id: String(product.id),
                        name: product.name,
                        subtitle: product.subtitle,
                        strength: product.strength,
                        form: product.form,
                        pack: product.quantity,
                        unitPrice: product.price,
                        image: product.image,
                      })
                    }}
                    type="button"
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Products
