import { Link } from 'react-router-dom'
import ParacetamolImage from '../assets/Paracetamol.jpg'
import BrufinImage from '../assets/Brufin.jpg'
import MetforminImage from '../assets/Metformin.webp'
import AlbuterolImage from '../assets/Albuterol.jpg'

const TopProduct = () => {
  const products = [
    {
      name: 'Paracetamol 500mg',
      price: 'NRP 45',
      strength: '500mg',
      form: 'Tablets',
      quantity: '20 ct',
      image: ParacetamolImage,
    },
    {
      name: 'Vitamin C Tablets',
      price: 'NRP 120',
      strength: '1000mg',
      form: 'Tablets',
      quantity: '30 ct',
      image: BrufinImage,
    },
    {
      name: 'Hand Sanitizer 250ml',
      price: 'NRP 99',
      strength: '70% alcohol',
      form: 'Liquid',
      quantity: '250 ml',
      image: MetforminImage,
    },
    {
      name: 'Digital Thermometer',
      price: 'NRP 299',
      strength: 'N/A',
      form: 'Device',
      quantity: '1 unit',
      image: AlbuterolImage,
    },
  ]

  return (
    <section className="bg-white px-4 py-14 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Top Products</h2>
          </div>
          <Link className="text-sm font-semibold italic text-slate-900 underline underline-offset-2 transition hover:text-teal-700" to="/products">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.name}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              to="/productsdetail"
            >
              {product.image ? (
                <img alt={product.name} className="h-48 w-full bg-white p-2 object-contain" src={product.image} />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-400">
                  
                </div>
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
          ))}
        </div>
      </div>
    </section>
  )
}

export default TopProduct