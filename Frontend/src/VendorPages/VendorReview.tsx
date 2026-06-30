import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FaRegComment, FaStar } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../VendorComponents/Navbar'
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain'
import ImageLightbox from '../components/ImageLightbox'
import fallbackImage from '../assets/Hero1.png'
import {
  fetchVendorReviews,
  resolveReviewAuthorAvatar,
  submitVendorReviewReply,
  toggleVendorReviewLike,
  type ReviewDto,
} from '../lib/reviewApi'
import { getStoredUser } from '../lib/auth'

const VendorReview = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [brokenReviewAvatars, setBrokenReviewAvatars] = useState<Set<number>>(() => new Set())
  const [likingReviewId, setLikingReviewId] = useState<number | null>(null)
  const [previewReviewImage, setPreviewReviewImage] = useState<{ url: string; alt: string } | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({})
  const [submittingReplyId, setSubmittingReplyId] = useState<number | null>(null)
  const [openCommentReviewIds, setOpenCommentReviewIds] = useState<Set<number>>(() => new Set())
  const currentUser = getStoredUser()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVendorReviews()
        setReviews(data)
      } catch {
        setError('Could not load customer reviews.')
        setReviews([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return reviews
    return reviews.filter(
      (review) =>
        review.author.toLowerCase().includes(query) ||
        review.productName.toLowerCase().includes(query) ||
        review.body.toLowerCase().includes(query) ||
        (review.vendorReplyBody?.toLowerCase().includes(query) ?? false),
    )
  }, [reviews, searchTerm])

  const handleToggleReviewLike = async (reviewId: number) => {
    setLikingReviewId(reviewId)
    try {
      const updated = await toggleVendorReviewLike(reviewId)
      setReviews((prev) => prev.map((review) => (review.id === reviewId ? updated : review)))
    } catch {
      // ignore — vendor session may have expired
    } finally {
      setLikingReviewId(null)
    }
  }

  const handleSubmitReply = async (event: FormEvent, reviewId: number) => {
    event.preventDefault()
    const body = (replyDrafts[reviewId] ?? '').trim()
    if (!body) {
      toast.error('Please write a reply before posting.')
      return
    }
    setSubmittingReplyId(reviewId)
    const hadReply = reviews.some((review) => review.id === reviewId && review.vendorReplyBody)
    try {
      const updated = await submitVendorReviewReply(reviewId, body)
      setReviews((prev) => prev.map((review) => (review.id === reviewId ? updated : review)))
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: updated.vendorReplyBody ?? body }))
      toast.success(hadReply ? 'Reply updated.' : 'Reply posted.')
    } catch {
      toast.error('Could not post your reply. Please try again.')
    } finally {
      setSubmittingReplyId(null)
    }
  }

  const toggleCommentSection = (reviewId: number) => {
    setOpenCommentReviewIds((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) {
        next.delete(reviewId)
      } else {
        next.add(reviewId)
      }
      return next
    })
  }

  return (
    <VendorLayout>
      <Navbar />
      <VendorMain>
        <FadeInOnScroll>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Customer reviews</h1>
              <p className="mt-1 text-sm text-slate-600">
                See what buyers are saying about your products after purchase and delivery.
              </p>
            </div>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:max-w-xs"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews..."
              type="search"
              value={searchTerm}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Loading reviews…</p>
            ) : error ? (
              <p className="px-5 py-8 text-center text-sm text-rose-600">{error}</p>
            ) : filteredReviews.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                {reviews.length === 0
                  ? 'No customer reviews yet. Reviews appear after buyers receive their orders.'
                  : 'No reviews match your search.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredReviews.map((review) => (
                  <li className="p-5" key={review.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <img
                        alt={review.productName}
                        className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover"
                        src={review.imageUrl ?? fallbackImage}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-base font-semibold text-slate-900">{review.productName}</p>
                          <span className="text-xs text-slate-500">{review.createdAt}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          {(() => {
                            const authorAvatar = resolveReviewAuthorAvatar(review, currentUser)
                            const showAuthorInitial = !authorAvatar || brokenReviewAvatars.has(review.id)
                            if (showAuthorInitial) {
                              return (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                                  {review.author.charAt(0).toUpperCase()}
                                </div>
                              )
                            }
                            return (
                              <img
                                alt={review.author}
                                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setBrokenReviewAvatars((prev) => {
                                    const next = new Set(prev)
                                    next.add(review.id)
                                    return next
                                  })
                                }
                                src={authorAvatar}
                              />
                            )
                          })()}
                          <div>
                            <p className="text-sm font-medium text-slate-700">{review.author}</p>
                            <div className="mt-1 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'text-amber-400' : 'text-slate-300'}`}
                                  key={`${review.id}-${star}`}
                                />
                              ))}
                              <span className="ml-1 text-xs font-semibold text-slate-600">{review.rating}.0</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{review.body}</p>
                        <div className="mt-3 flex w-full flex-col items-start gap-3">
                          {review.imageUrl ? (
                            <button
                              className="block cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-transparent p-0 hover:bg-transparent"
                              onClick={() =>
                                setPreviewReviewImage({
                                  url: review.imageUrl!,
                                  alt: `Review photo for ${review.productName}`,
                                })
                              }
                              type="button"
                            >
                              <img
                                alt={`Review photo for ${review.productName}`}
                                className="block max-h-56 max-w-full object-cover"
                                src={review.imageUrl}
                              />
                            </button>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-4">
                            <button
                              aria-label={review.likedByMe ? 'Unlike this review' : 'Like this review'}
                              aria-pressed={review.likedByMe}
                              className={`inline-flex cursor-pointer items-center gap-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                                review.likedByMe ? 'text-teal-700' : 'text-slate-500'
                              }`}
                              disabled={likingReviewId === review.id}
                              onClick={() => void handleToggleReviewLike(review.id)}
                              type="button"
                            >
                              <svg
                                aria-hidden="true"
                                className="h-4 w-4"
                                fill={review.likedByMe ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14 9V5a3 3 0 0 0-3-3L7 11v11h11.28a2 2 0 0 0 1.97-1.67l1.38-9A2 2 0 0 0 19.65 9H14Z" />
                                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                              </svg>
                              <span>{review.likedByMe ? 'Liked' : 'Like'}</span>
                              <span>·</span>
                              <span>{review.likes}</span>
                            </button>
                            <button
                              aria-expanded={openCommentReviewIds.has(review.id)}
                              aria-label={openCommentReviewIds.has(review.id) ? 'Hide reply' : 'Reply to review'}
                              className={`inline-flex cursor-pointer items-center gap-1.5 text-sm ${
                                openCommentReviewIds.has(review.id) || review.vendorReplyBody
                                  ? 'text-teal-700'
                                  : 'text-slate-500'
                              }`}
                              onClick={() => toggleCommentSection(review.id)}
                              type="button"
                            >
                              <FaRegComment className="h-4 w-4" aria-hidden="true" />
                              {review.vendorReplyBody ? <span>1</span> : null}
                            </button>
                          </div>
                        </div>
                        {openCommentReviewIds.has(review.id) ? (
                        <form
                          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-4"
                          onSubmit={(event) => void handleSubmitReply(event, review.id)}
                        >
                          <p className="text-sm font-semibold text-slate-900">Reply to customer</p>
                          <textarea
                            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                            onChange={(event) =>
                              setReplyDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))
                            }
                            placeholder="Thank the customer or address their feedback..."
                            rows={3}
                            value={replyDrafts[review.id] ?? review.vendorReplyBody ?? ''}
                          />
                          <button
                            className="mt-3 cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={submittingReplyId === review.id}
                            type="submit"
                          >
                            {submittingReplyId === review.id
                              ? 'Posting…'
                              : review.vendorReplyBody
                                ? 'Update reply'
                                : 'Post reply'}
                          </button>
                        </form>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FadeInOnScroll>
      </VendorMain>
      {previewReviewImage ? (
        <ImageLightbox
          alt={previewReviewImage.alt}
          imageUrl={previewReviewImage.url}
          onClose={() => setPreviewReviewImage(null)}
        />
      ) : null}
    </VendorLayout>
  )
}

export default VendorReview
