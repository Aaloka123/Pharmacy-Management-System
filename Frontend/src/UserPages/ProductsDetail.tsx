import { useState, type FormEvent } from 'react'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Header from '../UserComponents/Header'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'
import AlbuterolImage from '../assets/Albuterol.jpg'
import LisinoprilImage from '../assets/Lisinopril.jpg'
import MetforminImage from '../assets/Metformin.webp'
import TopProduct from '../UserComponents/TopProduct'

type Review = {
  id: string
  author: string
  body: string
  rating: number
  likes: number
  likedByMe: boolean
  createdAt: string
}

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

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      author: 'Priya K.',
      body: 'Worked well for what my doctor prescribed. Clear packaging and arrived on time.',
      rating: 5,
      likes: 4,
      likedByMe: false,
      createdAt: 'Apr 12, 2026',
    },
    {
      id: '2',
      author: 'Daniel M.',
      body: 'Pharmacist was helpful explaining how to take it with food. Good experience overall.',
      rating: 4,
      likes: 2,
      likedByMe: false,
      createdAt: 'Apr 8, 2026',
    },
  ])
  const [reviewBody, setReviewBody] = useState('')
  const [reviewRating, setReviewRating] = useState(0)

  const handleSubmitReview = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = reviewBody.trim()
    if (!trimmed) return
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`
    const createdAt = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    setReviews((prev) => [
      { id, author: 'Logged-in User', body: trimmed, rating: reviewRating, likes: 0, likedByMe: false, createdAt },
      ...prev,
    ])
    setReviewBody('')
    setReviewRating(0)
  }

  const toggleReviewLike = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        if (r.likedByMe) {
          return { ...r, likedByMe: false, likes: Math.max(0, r.likes - 1) }
        }
        return { ...r, likedByMe: true, likes: r.likes + 1 }
      }),
    )
  }

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

          <h3 className="mt-10 text-2xl font-bold text-slate-900">Customer Reviews</h3>
          <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <form className="border-b border-slate-100 pb-6" onSubmit={handleSubmitReview}>
              <div className="mt-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rating</p>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      aria-pressed={reviewRating === star}
                      className={`text-4xl leading-none transition ${
                        star <= reviewRating ? 'text-amber-400' : 'text-slate-300'
                      }`}
                      key={star}
                      onClick={() => setReviewRating(star)}
                      type="button"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-4 block">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Review</span>
                <textarea
                  className="mt-1.5 min-h-[100px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="How was the product, delivery, or support?"
                  required
                  value={reviewBody}
                />
              </label>
              <button
                className="mt-4 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                type="submit"
              >
                Post review
              </button>
            </form>

            <div className="pt-6">
              <p className="text-sm font-semibold text-slate-800">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
              <ul className="mt-4 space-y-5">
                {reviews.map((r) => (
                  <li className="rounded-xl border border-slate-100 bg-white p-4" key={r.id}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
                        {r.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-slate-900">{r.author}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p aria-label={`${r.rating} out of 5 stars`} className="text-base text-amber-400">
                            {'★'.repeat(r.rating)}
                            <span className="text-slate-300">{'★'.repeat(5 - r.rating)}</span>
                          </p>
                          <span className="text-xs text-slate-500">{r.createdAt}</span>
                        </div>
                        <p className="mt-2.5 text-[15px] leading-7 text-slate-700">{r.body}</p>
                        <button
                          aria-label={r.likedByMe ? 'Unlike this review' : 'Like this review'}
                          aria-pressed={r.likedByMe}
                          className={`mt-3 inline-flex items-center gap-1.5 text-sm ${
                            r.likedByMe ? 'text-teal-700' : 'text-slate-500'
                          }`}
                          onClick={() => toggleReviewLike(r.id)}
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill={r.likedByMe ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 9V5a3 3 0 0 0-3-3L7 11v11h11.28a2 2 0 0 0 1.97-1.67l1.38-9A2 2 0 0 0 19.65 9H14Z" />
                            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          <span>{r.likedByMe ? 'Liked' : 'Like'}</span>
                          <span>·</span>
                          <span>{r.likes}</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </section>
      </main>
      <TopProduct />
      <Footer />
      <Copyright />
    </div>
  )
}

export default ProductsDetail