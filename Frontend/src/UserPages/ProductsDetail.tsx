import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Header from '../UserComponents/Header'
import { addToCart, CartAuthRequiredError, isCartApiError } from '../lib/cartStorage'
import { getPublicProduct, getProductImageUrls, type ProductDto } from '../lib/productsApi'
import {
  fetchProductReviews,
  fetchReviewEligibility,
  submitProductReview,
  toggleReviewLike,
  resolveReviewAuthorAvatar,
  type ReviewDto,
  type ReviewEligibilityDto,
} from '../lib/reviewApi'
import { ApiRequestError } from '../lib/api'
import { getStoredUser, onAuthChange, type AuthUser } from '../lib/auth'
import { FaStar } from 'react-icons/fa'
import TopProduct from '../UserComponents/TopProduct'
import FadeInOnScroll from '../components/FadeInOnScroll'
import ImageLightbox from '../components/ImageLightbox'

const ProductStarRating = ({ rating }: { rating: number }) => (
  <div aria-label={`${rating} out of 5 stars`} className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <FaStar
        key={star}
        className={`h-4 w-4 ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
      />
    ))}
  </div>
)

const stockLabel = (stock: number) => {
  if (stock <= 0) return { text: 'Out of stock', tone: 'text-rose-600' }
  if (stock <= 10) return { text: `${stock} units left (low stock)`, tone: 'text-rose-600' }
  return { text: `${stock} units available`, tone: 'text-slate-900' }
}

const ProductsDetail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const productIdFromState = (location.state as { productId?: number } | null)?.productId
  const productIdFromQuery = searchParams.get('id')
  const productId =
    productIdFromState ??
    (productIdFromQuery && !Number.isNaN(Number(productIdFromQuery)) ? Number(productIdFromQuery) : null)

  const [product, setProduct] = useState<ProductDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser())
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null)
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [likingReviewId, setLikingReviewId] = useState<number | null>(null)
  const [brokenReviewAvatars, setBrokenReviewAvatars] = useState<Set<number>>(() => new Set())
  const [brokenVendorAvatars, setBrokenVendorAvatars] = useState<Set<number>>(() => new Set())
  const [previewReviewImage, setPreviewReviewImage] = useState<{ url: string; alt: string } | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => onAuthChange(() => setCurrentUser(getStoredUser())), [])

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      await addToCart({ productId: product.id })
      toast.success('Added to cart.')
    } catch (err) {
      if (err instanceof CartAuthRequiredError) {
        toast.info('Please log in to add items to your cart.')
        navigate('/login', { state: { from: `/productsdetail?id=${product.id}` } })
        return
      }
      if (isCartApiError(err) && err.response.status === 400) {
        toast.warn('Not enough stock available for this product.')
        return
      }
      if (isCartApiError(err) && err.response.status === 404) {
        toast.error('This product is no longer available.')
        return
      }
      toast.error('Could not add to cart.')
      console.error(err)
    } finally {
      setAddingToCart(false)
    }
  }

  useEffect(() => {
    if (productId == null) {
      setLoading(false)
      setError('No product selected.')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getPublicProduct(productId)
        if (cancelled) return
        setProduct(data)
        const gallery = getProductImageUrls(data.images)
        setSelectedImage(gallery[0] ?? null)
      } catch (err) {
        if (!cancelled) {
          setError('Could not load product details.')
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
  }, [productId])

  useEffect(() => {
    if (productId == null) return

    let cancelled = false
    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const data = await fetchProductReviews(productId)
        if (cancelled) return
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setReviews([])
          setAverageRating(0)
          setTotalReviews(0)
        }
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    }
    void loadReviews()
    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    if (productId == null || !currentUser || currentUser.role !== 'USER') {
      setHasReviewed(false)
      setCanReview(false)
      return
    }

    let cancelled = false
    const loadEligibility = async () => {
      try {
        const data = await fetchReviewEligibility(productId)
        if (!cancelled) {
          setHasReviewed(data.hasReviewed)
          setCanReview(data.canReview)
        }
      } catch {
        if (!cancelled) {
          setHasReviewed(false)
          setCanReview(false)
        }
      }
    }
    void loadEligibility()
    return () => {
      cancelled = true
    }
  }, [productId, currentUser])

  useEffect(() => {
    return () => {
      if (reviewImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(reviewImagePreview)
      }
    }
  }, [reviewImagePreview])

  const galleryImages = useMemo(() => {
    if (!product) return []
    return getProductImageUrls(product.images)
  }, [product])

  const thumbnailImages = galleryImages.filter((image) => image !== selectedImage).slice(0, 3)
  const displayedRating = totalReviews > 0 ? averageRating : 0
  const hasMyReview = useMemo(() => {
    if (!currentUser) return false
    return reviews.some((review) => review.authorId === currentUser.id)
  }, [reviews, currentUser])
  const showReviewForm = canReview && !hasReviewed && !hasMyReview

  const categoryFormLine = product ? `${product.category} · ${product.form}` : ''

  const stock = product ? stockLabel(product.stock) : null

  const handleReviewImageChange = (file: File | null) => {
    if (reviewImagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(reviewImagePreview)
    }
    setReviewImageFile(file)
    setReviewImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault()
    if (!productId || reviewRating < 1) {
      toast.warn('Please select a star rating.')
      return
    }
    const trimmed = reviewBody.trim()
    if (!trimmed) return

    if (!currentUser) {
      toast.info('Please log in to post a review.')
      navigate('/login', { state: { from: `/productsdetail?id=${productId}` } })
      return
    }

    setSubmittingReview(true)
    try {
      const created = await submitProductReview(productId, reviewRating, trimmed, reviewImageFile)
      setReviews((prev) => [created, ...prev])
      setTotalReviews((count) => count + 1)
      setHasReviewed(true)
      setAverageRating((prev) => {
        const nextTotal = totalReviews + 1
        return Math.round(((prev * totalReviews + reviewRating) / nextTotal) * 10) / 10
      })
      setReviewBody('')
      setReviewRating(0)
      handleReviewImageChange(null)
      toast.success('Review posted.')
    } catch (err) {
      if (err instanceof ApiRequestError && err.response.status === 401) {
        toast.info('Please log in to post a review.')
        navigate('/login', { state: { from: `/productsdetail?id=${productId}` } })
        return
      }
      if (err instanceof ApiRequestError && err.response.status === 400) {
        toast.warn('You can review this product after your order is delivered.')
        return
      }
      toast.error('Could not post review.')
      console.error(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleToggleReviewLike = async (reviewId: number) => {
    if (!currentUser) {
      toast.info('Please log in to like reviews.')
      navigate('/login', { state: { from: `/productsdetail?id=${productId}` } })
      return
    }

    setLikingReviewId(reviewId)
    try {
      const updated = await toggleReviewLike(reviewId)
      setReviews((prev) => prev.map((review) => (review.id === reviewId ? updated : review)))
    } catch (err) {
      if (err instanceof ApiRequestError && err.response.status === 401) {
        toast.info('Please log in to like reviews.')
        return
      }
      toast.error('Could not update like.')
    } finally {
      setLikingReviewId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white">
        <Header />
        <main className="px-4 py-16 text-center text-slate-600 md:px-8 lg:px-[80px]">Loading product...</main>
        <Footer />
        <Copyright />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="bg-white">
        <Header />
        <main className="px-4 py-16 text-center md:px-8 lg:px-[80px]">
          <p className="text-slate-600">{error ?? 'Product not found.'}</p>
          <button
            className="mt-4 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white"
            onClick={() => navigate('/products')}
            type="button"
          >
            Back to products
          </button>
        </main>
        <Footer />
        <Copyright />
      </div>
    )
  }

  return (
    <div className="bg-white">
      <Header />
      <main className="px-4 py-6 md:px-8 md:py-8 lg:px-[80px]">
        <div className="mb-5 text-[14px] text-slate-500">
          <Link to="/">Home</Link>
          <span className="mx-2 text-slate-400">/</span>
          <Link to="/products">Products</Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-700">{product.productName}</span>
        </div>
        <FadeInOnScroll>
        <section className="p-1 md:p-2">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                {selectedImage ? (
                  <img alt={product.productName} className="h-64 w-full object-contain sm:h-80 lg:h-96" src={selectedImage} />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center bg-slate-100 text-sm text-slate-400 sm:h-80 lg:h-96">
                    No image available
                  </div>
                )}
              </div>

              {thumbnailImages.length > 0 ? (
                <div className="mt-4 flex items-center gap-3">
                  {thumbnailImages.map((image, index) => (
                    <button
                      className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 transition hover:border-slate-300"
                      key={`${image}-${index}`}
                      onClick={() => setSelectedImage(image)}
                      type="button"
                    >
                      <img
                        alt={`${product.productName} preview ${index + 1}`}
                        className="h-full w-full object-contain"
                        src={image}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{product.productName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ProductStarRating rating={Math.round(displayedRating)} />
                <span className="text-sm font-semibold text-slate-800">
                  {totalReviews > 0 ? `${displayedRating.toFixed(1)} · ${totalReviews} reviews` : 'No reviews yet'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{categoryFormLine}</p>
              {product.vendorBusinessName ? (
                <p className="mt-1 text-sm text-slate-600">
                  By:{' '}
                  <Link
                    className="font-bold text-slate-900 underline-offset-2 hover:underline"
                    state={{ vendorId: product.vendorId }}
                    to={`/vendorprofile?id=${product.vendorId}`}
                  >
                    {product.vendorBusinessName}
                  </Link>
                </p>
              ) : null}
              <p className="mt-3 text-2xl font-bold text-teal-700">NRP {Number(product.price).toLocaleString()}</p>
              {stock ? (
                <span className={`mt-2 inline-flex text-xs ${stock.tone}`}>
                  Stock: <span className="px-1 font-bold">{stock.text}</span>
                </span>
              ) : null}
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-slate-600">{product.productDescription}</p>

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

              <p className="mt-4 text-xs text-slate-500">
                Expiry date: <span className="font-semibold text-slate-700">{product.expiryDate}</span>
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  className="cursor-pointer rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={product.stock <= 0 || addingToCart}
                  onClick={() => void handleAddToCart()}
                  type="button"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  className="cursor-pointer rounded-lg border border-teal-700 bg-transparent px-6 py-2.5 text-sm font-semibold text-teal-700 transition duration-200 hover:bg-teal-50"
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
                  {product.dosageInstructions.length > 0 ? (
                    product.dosageInstructions.map((item) => (
                      <li className="flex items-center gap-2" key={item}>
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">No dosage instructions provided.</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-rose-700">Side Effects</h4>
                <ul className="mt-3 space-y-3 text-[14px] leading-7 text-slate-700">
                  {product.sideEffects.length > 0 ? (
                    product.sideEffects.map((item) => (
                      <li className="flex items-center gap-2" key={item}>
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">No side effects listed.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-sky-50 p-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-sky-700">Storage Requirements</h4>
              <p className="mt-2 text-[14px] leading-7 text-slate-700">{product.storageRequirements}</p>
            </div>
          </section>

          <h3 className="mt-10 text-2xl font-bold text-slate-900">Reviews</h3>
          <section className="mt-3">
            {showReviewForm ? (
            <form className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6" onSubmit={(e) => void handleSubmitReview(e)}>
              <p className="text-sm text-slate-600">
                Share your experience after purchasing this product.
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rating</p>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        aria-pressed={reviewRating === star}
                        className={`cursor-pointer leading-none transition ${star <= reviewRating ? 'text-amber-400' : 'text-slate-300'}`}
                        key={star}
                        onClick={() => setReviewRating(star)}
                        type="button"
                      >
                        <FaStar className="h-6 w-6" />
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
                <div className="mt-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Product photo</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      <span className="max-w-[160px] truncate">
                        {reviewImageFile ? reviewImageFile.name : 'Choose image'}
                      </span>
                      <input
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleReviewImageChange(e.target.files?.[0] ?? null)}
                        type="file"
                      />
                    </label>
                    {reviewImagePreview ? (
                      <div className="relative">
                        <img
                          alt="Review preview"
                          className="h-12 w-12 rounded-lg border border-slate-200 object-cover shadow-sm"
                          src={reviewImagePreview}
                        />
                        <button
                          aria-label="Remove photo"
                          className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => handleReviewImageChange(null)}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <button
                  className="mt-4 cursor-pointer rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submittingReview}
                  type="submit"
                >
                  {submittingReview ? 'Posting…' : 'Post review'}
              </button>
            </form>
            ) : null}

            <div className={`rounded-2xl border border-slate-200 bg-white p-5 md:p-6${showReviewForm ? ' mt-4' : ''}`}>
              <p className="text-sm font-semibold text-slate-800">
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
              {reviewsLoading ? (
                <p className="mt-4 text-sm text-slate-500">Loading reviews…</p>
              ) : reviews.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>
              ) : (
                <ul className="mt-4 space-y-5">
                  {reviews.map((r) => {
                    const authorAvatar = resolveReviewAuthorAvatar(r, currentUser)
                    const showAuthorInitial = !authorAvatar || brokenReviewAvatars.has(r.id)
                    return (
                    <li className="rounded-xl border border-slate-100 bg-white p-4" key={r.id}>
                      <div className="flex items-start gap-3">
                        {!showAuthorInitial ? (
                          <img
                            alt={r.author}
                            className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenReviewAvatars((prev) => {
                                const next = new Set(prev)
                                next.add(r.id)
                                return next
                              })
                            }
                            src={authorAvatar}
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
                            {r.author.charAt(0).toUpperCase()}
                          </div>
                        )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold text-slate-900">{r.author}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <div aria-label={`${r.rating} out of 5 stars`} className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar
                                    className={`h-3.5 w-3.5 ${star <= r.rating ? 'text-amber-400' : 'text-slate-300'}`}
                                    key={`${r.id}-star-${star}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-500">{r.createdAt}</span>
                            </div>
                            <p className="mt-2.5 text-[15px] leading-7 text-slate-700">{r.body}</p>
                            {r.imageUrl ? (
                              <button
                                className="mt-3 inline-block cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-transparent p-0 hover:bg-transparent"
                                onClick={() =>
                                  setPreviewReviewImage({
                                    url: r.imageUrl!,
                                    alt: `${r.author} review photo`,
                                  })
                                }
                                type="button"
                              >
                                <img
                                  alt={`${r.author} review photo`}
                                  className="block max-h-48 max-w-full object-cover"
                                  src={r.imageUrl}
                                />
                              </button>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                aria-label={r.likedByMe ? 'Unlike this review' : 'Like this review'}
                                aria-pressed={r.likedByMe}
                                className={`inline-flex cursor-pointer items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                                  r.likedByMe ? 'text-teal-700' : 'text-slate-500'
                                }`}
                                disabled={likingReviewId === r.id}
                                onClick={() => void handleToggleReviewLike(r.id)}
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
                              {r.vendorLikerName ? (
                                <>
                                  <span className="text-sm text-slate-500">·</span>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  {!r.vendorLikerProfileImage || brokenVendorAvatars.has(r.id) ? (
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
                                      {r.vendorLikerName.charAt(0).toUpperCase()}
                                    </div>
                                  ) : (
                                    <img
                                      alt={r.vendorLikerName}
                                      className="h-6 w-6 shrink-0 rounded-full border border-slate-200 object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={() =>
                                        setBrokenVendorAvatars((prev) => {
                                          const next = new Set(prev)
                                          next.add(r.id)
                                          return next
                                        })
                                      }
                                      src={r.vendorLikerProfileImage}
                                    />
                                  )}
                                  <span>
                                    Liked by{' '}
                                    <span className="font-medium text-slate-700">{r.vendorLikerName}</span>
                                  </span>
                                </div>
                                </>
                              ) : null}
                            </div>
                        </div>
                      </div>
                    </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </section>
        </FadeInOnScroll>
      </main>
      <FadeInOnScroll delay={100}><TopProduct /></FadeInOnScroll>
      <Footer />
      <Copyright />
      {previewReviewImage ? (
        <ImageLightbox
          alt={previewReviewImage.alt}
          imageUrl={previewReviewImage.url}
          onClose={() => setPreviewReviewImage(null)}
        />
      ) : null}
    </div>
  )
}

export default ProductsDetail
