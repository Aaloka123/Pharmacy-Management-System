import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import { useMemo, useState } from 'react'
import AlbuterolImage from '../assets/Albuterol.jpg'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'
import LisinoprilImage from '../assets/Lisinopril.jpg'
import MetforminImage from '../assets/Metformin.webp'
import ParacetamolImage from '../assets/Paracetamol.jpg'
import BrufinImage from '../assets/Brufin.jpg'

const categories = ['All Medications', 'Antibiotics', 'Cardiovascular', 'Respiratory', 'Endocrinology']

const productList = [
  {
    name: 'Amoxicillin',
    category: 'Antibiotics',
    subtitle: 'Antibiotics · Penicillin Type',
    strength: '500mg',
    form: 'Capsules',
    quantity: '30 ct',
    price: 425,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    image: AmoxicillinImage,
  },
  {
    name: 'Lisinopril',
    category: 'Cardiovascular',
    subtitle: 'Cardiovascular · ACE Inhibitor',
    strength: '10mg',
    form: 'Tablets',
    quantity: '90 ct',
    price: 280,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    image: LisinoprilImage,
  },
  {
    name: 'Albuterol',
    category: 'Respiratory',
    subtitle: 'Respiratory · Bronchodilator',
    strength: '90mcg',
    form: 'Inhaler',
    quantity: '200 met',
    price: 1150,
    stock: 'Low Stock',
    stockTone: 'bg-rose-100 text-rose-700',
    image: AlbuterolImage,
  },
  {
    name: 'Metformin',
    category: 'Endocrinology',
    subtitle: 'Endocrinology · Antidiabetic',
    strength: '850mg',
    form: 'Tablets',
    quantity: '60 ct',
    price: 360,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    image: MetforminImage,
  },
  {
    name: 'Atorvastatin',
    category: 'Cardiovascular',
    subtitle: 'Cardiovascular · Statin',
    strength: '40mg',
    form: 'Tablets',
    quantity: '30 ct',
    price: 790,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    image: ParacetamolImage,
  },
  {
    name: 'Cetrizine',
    category: 'Respiratory',
    subtitle: 'Respiratory · Antihistamine',
    strength: '10mg',
    form: 'Tablets',
    quantity: '20 ct',
    price: 240,
    stock: 'Low Stock',
    stockTone: 'bg-rose-100 text-rose-700',
    image: BrufinImage,
  },
  {
    name: 'Paracetamol 650',
    category: 'Antibiotics',
    subtitle: 'General · Pain Relief',
    strength: '650mg',
    form: 'Tablets',
    quantity: '15 ct',
    price: 320,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    image: ParacetamolImage,
  },
  {
    name: 'Brufen 400',
    category: 'Respiratory',
    subtitle: 'General · Anti-inflammatory',
    strength: '400mg',
    form: 'Tablets',
    quantity: '30 ct',
    price: 410,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    image: BrufinImage,
  },
]

const Products = () => {
  const maxProductPrice = Math.max(...productList.map((product) => product.price))
  const [selectedCategory, setSelectedCategory] = useState('All Medications')
  const [maxPrice, setMaxPrice] = useState(maxProductPrice)
  const [sortBy, setSortBy] = useState('default')

  const filteredProducts = useMemo(() => {
    const filtered = productList.filter((product) => {
      const matchesCategory = selectedCategory === 'All Medications' || product.category === selectedCategory
      const matchesPrice = product.price <= maxPrice
      return matchesCategory && matchesPrice
    })

    const sorted = [...filtered]
    if (sortBy === 'price-low-high') sorted.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-high-low') sorted.sort((a, b) => b.price - a.price)
    if (sortBy === 'name-a-z') sorted.sort((a, b) => a.name.localeCompare(b.name))
    return sorted
  }, [maxPrice, selectedCategory, sortBy])

  return (
    <div className="bg-slate-50">
      <Header />
      <main className="px-6 py-10 md:px-8">
        <section className="mx-auto max-w-[1200px] p-2 md:p-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                Manage and discover precision medications. Access our high quality inventory with verified pharmacological data.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-md">
              + New Prescription
            </button>
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                    selectedCategory === category
                      ? 'bg-teal-700 text-white shadow-sm hover:-translate-y-0.5 hover:bg-teal-800'
                      : 'bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900'
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
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Price Range</p>
                    <p className="text-sm font-semibold text-teal-700">NRP 0 - {maxPrice.toLocaleString()}</p>
                  </div>
                  <input
                    className="mt-3 w-full accent-teal-700"
                    max={maxProductPrice}
                    min={0}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    type="range"
                    value={maxPrice}
                  />
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
              {filteredProducts.map((product) => (
              <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md" key={product.name}>
                <div className="relative h-56 w-full bg-slate-50">
                  {product.image ? <img alt={product.name} className="h-full w-full object-contain bg-white p-2" src={product.image} /> : null}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${product.stockTone}`}>
                    {product.stock}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{product.subtitle}</p>
                  <p className="mt-2 text-base font-bold text-teal-700">NRP {product.price.toLocaleString()}</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
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
                    className="mt-5 flex w-full items-center justify-center rounded-full bg-teal-100 px-4 py-2.5 text-xs font-semibold text-teal-800 transition duration-200 hover:bg-teal-200 group-hover:bg-teal-200"
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