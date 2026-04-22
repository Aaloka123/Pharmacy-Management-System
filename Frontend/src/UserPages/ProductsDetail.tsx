import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Header from '../UserComponents/Header'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'

const ProductsDetail = () => {
  const product = {
    name: 'Amoxicillin',
    subtitle: 'Antibiotics · Penicillin Type',
    price: 425,
    stock: 'In Stock',
    stockTone: 'bg-emerald-100 text-emerald-700',
    strength: '500mg',
    form: 'Capsules',
    quantity: '30 ct',
    image: AmoxicillinImage,
  }

  return (
    <div className="bg-slate-50">
      <Header />
      <main className="px-[80px] py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
              <img alt={product.name} className="h-80 w-full object-contain" src={product.image} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
              <p className="mt-2 text-sm text-slate-600">{product.subtitle}</p>
              <p className="mt-3 text-2xl font-bold text-teal-700">NRP {product.price.toLocaleString()}</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${product.stockTone}`}>
                {product.stock}
              </span>

              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Strength</p>
                  <p className="mt-1 font-semibold text-slate-800">{product.strength}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Form</p>
                  <p className="mt-1 font-semibold text-slate-800">{product.form}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Quantity</p>
                  <p className="mt-1 font-semibold text-slate-800">{product.quantity}</p>
                </div>
              </div>

              <button
                className="mt-6 rounded-full bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                type="button"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default ProductsDetail