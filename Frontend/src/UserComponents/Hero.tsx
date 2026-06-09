import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi2'
import Hero1 from '../assets/Hero1.png'
import Hero2 from '../assets/Hero2.jpg'
import Hero3 from '../assets/Hero3.png'

const SLIDE_INTERVAL_MS = 7000

const slides = [
  {
    title: 'Your trusted multi-vendor pharmacy platform',
    description:
      'Discover medicines from verified partner pharmacies, compare options, and order with confidence — all in one place.',
    image: Hero1,
  },
  {
    title: 'Quality medicines from approved partners',
    description:
      'Every pharmacy on MedNexus is reviewed for compliance so you receive safe, authentic products every time.',
    image: Hero2,
  },
  {
    title: 'Simple ordering, clear visibility',
    description:
      'Browse inventory, track availability, and manage your health needs with a modern experience built for patients and pharmacies.',
    image: Hero3,
  },
]

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goToPreviousSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  useEffect(() => {
    if (isPaused) return

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [isPaused])

  const activeSlide = slides[currentSlide]

  return (
    <section className="bg-white">
      <div
        className="group relative min-h-[min(720px,calc(100vh-80px))] overflow-hidden text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            aria-hidden={index !== currentSlide}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            } ${index === currentSlide ? 'hero-slide-zoom' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-900/65 to-slate-900/25"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-slate-950/50 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex h-full min-h-[inherit] max-w-[1400px] flex-col justify-center px-6 py-16 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            <h1
              key={activeSlide.title}
              className="hero-fade-in text-3xl font-bold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-[3.25rem]"
            >
              {activeSlide.title}
            </h1>

            <p
              key={activeSlide.description}
              className="hero-fade-in mt-5 max-w-xl text-base leading-relaxed text-slate-200/95 md:text-lg"
            >
              {activeSlide.description}
            </p>

            <div className="hero-fade-in mt-9 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-950/25 transition hover:from-teal-400 hover:to-teal-500"
                to="/products"
              >
                Browse Medicines
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/55 hover:bg-white/15"
                to="/vendorsignup"
              >
                Partner With Us
              </Link>
            </div>

            <p className="mt-8 text-sm text-white/70">
              Join a growing network of partner pharmacies delivering care across the region.
            </p>
          </div>
        </div>

        <button
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20 md:left-8 md:flex lg:left-12"
          onClick={goToPreviousSlide}
          type="button"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <button
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20 md:right-8 md:flex lg:right-12"
          onClick={goToNextSlide}
          type="button"
        >
          <HiOutlineArrowRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-slate-950/20 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-6 py-4 md:px-12 lg:px-16">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                aria-current={currentSlide === index ? 'true' : undefined}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                className="group/dot flex cursor-pointer flex-col items-center gap-2 p-1"
                onClick={() => setCurrentSlide(index)}
                type="button"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? 'w-10 bg-teal-400'
                      : 'w-6 bg-white/40 group-hover/dot:bg-white/65'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
