import { useState } from 'react'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Header from '../UserComponents/Header'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'
import AlbuterolImage from '../assets/Albuterol.jpg'
import LisinoprilImage from '../assets/Lisinopril.jpg'
import MetforminImage from '../assets/Metformin.webp'

const ProductsDetail = () => {
  const product = {
    name: 'Amoxicillin',
    subtitle: 'Antibiotics · Penicillin Type',
    price: 425,
    stock: 'Stock: 20 units available',
    stockTone: 'text-slate-900',
    strength: '500mg',
    form: 'Capsules',
    quantity: '30 ct',
    image: AmoxicillinImage,
  }
  const productGallery = [AmoxicillinImage, AlbuterolImage, LisinoprilImage, MetforminImage]
  const [selectedImage, setSelectedImage] = useState(product.image)
  const thumbnailImages = productGallery.filter((image) => image !== selectedImage).slice(0, 3)

  return (
    <div className="bg-slate-50">
      <Header />
      <main className="px-[100px] py-8">
        <div className="mb-5 text-[14px] text-slate-500">
          <span>Home</span>
          <span className="mx-2 text-slate-400">/</span>
          <span>Products</span>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-700">Product Detail</span>
        </div>
        <section className="mx-[70px] p-1 md:p-2">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                <img alt={product.name} className="h-96 w-full object-contain" src={selectedImage} />
              </div>

              <div className="mt-4 flex items-center gap-3">
                {thumbnailImages.map((image, index) => (
                  <button
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 transition hover:border-slate-300"
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(image)}
                    type="button"
                  >
                    <img alt={`${product.name} preview ${index + 1}`} className="h-full w-full object-contain" src={image} />
                  </button>
                ))}
              </div>

            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
              <p className="mt-2 text-sm text-slate-600">{product.subtitle}</p>
              <p className="mt-3 text-2xl font-bold text-teal-700">NRP {product.price.toLocaleString()}</p>
              <span className={`mt-2 inline-flex text-xs ${product.stockTone}`}>
                Stock: <span className="px-1">20</span> units available
              </span>
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-slate-600">
                Amoxicillin is a commonly used antibiotic for bacterial infections. It helps treat conditions like respiratory, skin, and
                ear-related infections when prescribed by a healthcare professional.
              </p>

              <div className="mt-6 grid max-w-xl grid-cols-3 gap-6 text-sm">
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

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  className="rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800"
                  type="button"
                >
                  Add to Cart
                </button>
                <button
                  className="rounded-lg border border-teal-700 bg-transparent px-6 py-2.5 text-sm font-semibold text-teal-700 transition duration-200 hover:bg-teal-50"
                  type="button"
                >
                  Inquiry Now
                </button>
              </div>
            </div>
          </div>

          <h3 className="mt-8 text-2xl font-bold text-slate-900">Detailed Administration &amp; Safety</h3>
          <section className="mt-3 rounded-2xl bg-white p-5">
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">Dosage Instructions</h4>
                <ul className="mt-3 space-y-3 text-[14px] leading-7 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600"></span>
                    Usual dose is 10mg to 80mg once daily.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600"></span>
                    Can be administered at any time of day, with or without food.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600"></span>
                    Individualize dose based on baseline LDL-C levels.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-rose-700">Side Effects</h4>
                <ul className="mt-3 space-y-3 text-[14px] leading-7 text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-0 w-0 shrink-0 border-x-[6px] border-b-10 border-x-transparent border-b-rose-600"></span>
                    Myalgia and Arthralgia (most common).
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-0 w-0 shrink-0 border-x-[6px] border-b-10 border-x-transparent border-b-rose-600"></span>
                    Nasopharyngitis or Diarrhea.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-0 w-0 shrink-0 border-x-[6px] border-b-10 border-x-transparent border-b-rose-600"></span>
                    Elevated liver enzymes (monitor ALT).
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-sky-50 p-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-sky-700">Storage Requirements</h4>
              <p className="mt-2 text-[14px] leading-7 text-slate-700">
                Store at 20C to 25C (68F to 77F); excursions permitted to 15C to 30C (59F to 86F).
              </p>
            </div>
          </section>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default ProductsDetail