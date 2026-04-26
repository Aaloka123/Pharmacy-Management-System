import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const Hero = () => {
  const slides = [
    {
      title: 'Smarter Pharmacy Operations',
      description:
        'Manage inventory, prescriptions, and supplier workflows from one modern dashboard built for speed and accuracy.',
      badge: 'All-in-one platform',
    },
    {
      title: 'Safer Prescription Tracking',
      description:
        'Reduce errors with clear records, expiry monitoring, and workflow visibility designed for pharmacy teams.',
      badge: 'Patient safety first',
    },
    {
      title: 'Actionable Insights & Reports',
      description:
        'Track performance trends, stock movement, and operations metrics to make better day-to-day decisions.',
      badge: 'Data-driven decisions',
    },
  ]

  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 10000)

    return () => window.clearInterval(interval)
  }, [slides.length])

  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  return (
    <section className="bg-white">
      <div>
        <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-teal-900 text-white shadow-xl">
          <button
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-lg font-semibold text-white transition hover:bg-white/20"
            onClick={goToPreviousSlide}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-lg font-semibold text-white transition hover:bg-white/20"
            onClick={goToNextSlide}
            type="button"
          >
            →
          </button>
          <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[1400px] grid-cols-1 items-center gap-10 px-6 py-12 md:px-12 lg:grid-cols-2 lg:px-16">
            <div>
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">
                {slides[currentSlide].badge}
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{slides[currentSlide].title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">{slides[currentSlide].description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400"
                  to="/vendorsignup"
                >
                  Get Started
                </Link>
                <Link
                  className="rounded-lg border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  to="/about"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div />
          </div>

          <div className="mx-auto flex w-full max-w-[1400px] items-center px-6 py-4 md:px-12 lg:px-16">
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2.5 rounded-full transition ${currentSlide === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                  onClick={() => setCurrentSlide(index)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero