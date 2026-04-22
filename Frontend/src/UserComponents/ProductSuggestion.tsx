import { Link } from 'react-router-dom'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'
import LisinoprilImage from '../assets/Lisinopril.jpg'
import AlbuterolImage from '../assets/Albuterol.jpg'
import MetforminImage from '../assets/Metformin.webp'

const ProductSuggestion = () => {
  const products = [
    {
      name: 'Cough Syrup 100ml',
      price: 'NRP 165',
      image: AmoxicillinImage,
    },
    {
      name: 'Antacid Tablets',
      price: 'NRP 80',
      image: LisinoprilImage,
    },
    {
      name: 'Blood Pressure Monitor',
      price: 'NRP 2,499',
      image: AlbuterolImage,
    },
    {
      name: 'First Aid Kit',
      price: 'NRP 599',
      image: MetforminImage,
    },
  ]

  return (
    <section className="bg-white px-4 py-14 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Product Suggestions</h2>
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
                <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-400"></div>
              )}
              <div className="p-4">
                <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-2 text-lg font-bold text-teal-700">{product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductSuggestion