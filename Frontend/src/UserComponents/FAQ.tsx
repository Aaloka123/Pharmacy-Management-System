import {
  LuClipboardList,
  LuCreditCard,
  LuPackage,
  LuPackageSearch,
  LuRotateCcw,
  LuTruck,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'

const faqs: { question: string; answer: string; icon: IconType }[] = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse Products, add items to your cart, and complete checkout. Review everything before you confirm.',
    icon: LuPackage,
  },
  {
    question: 'Do I need a prescription for all medicines?',
    answer:
      'Prescription-only items require a valid prescription. Over-the-counter products can be ordered directly.',
    icon: LuClipboardList,
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Most orders arrive within 24–48 hours, depending on your location and product availability.',
    icon: LuTruck,
  },
  {
    question: 'Can I return or cancel my order?',
    answer:
      'Cancel before dispatch. Returns are accepted for damaged or incorrect items per our policy.',
    icon: LuRotateCcw,
  },
  {
    question: 'How can I track my order?',
    answer:
      'Use Order Tracking in the menu after checkout to follow your order from dispatch to delivery.',
    icon: LuPackageSearch,
  },
  {
    question: 'Is online payment secure?',
    answer:
      'Yes. Payments use secure checkout and your card details are encrypted and never stored by us.',
    icon: LuCreditCard,
  },
]

const faqGradientTop = '#7FCBC3'
const faqGradientMid = '#4DB6AB'
const faqGradientBottom = '#2f7570'
const faqSectionBackground = `linear-gradient(180deg, ${faqGradientTop} 0%, ${faqGradientMid} 48%, ${faqGradientBottom} 100%)`

const FaqWaveTop = () => (
  <div aria-hidden className="relative z-10 leading-0">
    <svg
      className="block h-24 w-full md:h-32"
      preserveAspectRatio="none"
      viewBox="0 0 1440 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,120 L0,16 Q360,58 720,28 T1440,16 L1440,120 Z"
        fill={faqGradientTop}
      />
    </svg>
  </div>
)

const FaqWaveBottom = () => (
  <div aria-hidden className="relative z-10 leading-0">
    <svg
      className="block h-24 w-full md:h-32"
      preserveAspectRatio="none"
      viewBox="0 0 1440 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,0 L1440,0 L1440,16 Q1080,58 720,28 T0,16 Z"
        fill={faqGradientBottom}
      />
    </svg>
  </div>
)

const FAQ = () => {
  return (
    <section className="relative bg-white">
      <FaqWaveTop />

      <div className="px-6 py-12 md:px-8 md:py-16" style={{ background: faqSectionBackground }}>
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-[2rem]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[210px]">
            {faqs.map((faq) => {
              const Icon = faq.icon

              return (
                <article
                  className="group box-border flex h-[210px] w-full flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/10 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.1)] transition duration-300 hover:border-white hover:bg-white/15 hover:shadow-[0_14px_40px_rgba(15,23,42,0.14)]"
                  key={faq.question}
                >
                  <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 transition group-hover:bg-white/20">
                    <Icon aria-hidden className="h-5 w-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="line-clamp-2 shrink-0 text-[15px] font-bold leading-snug text-white">
                    {faq.question}
                  </h3>
                  <p className="mt-2 line-clamp-4 min-h-0 flex-1 overflow-hidden text-xs leading-5 text-white/90">
                    {faq.answer}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>

      <FaqWaveBottom />
    </section>
  )
}

export default FAQ
