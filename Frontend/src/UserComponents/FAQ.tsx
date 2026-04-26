const faqs = [
  {
    question: 'How do I place an order?',
    answer:
      'Go to the Products page, choose your medicine, and proceed through checkout. You can review your items in the cart before confirming.',
  },
  {
    question: 'Do I need a prescription for all medicines?',
    answer:
      'Prescription-only medicines require a valid prescription. Over-the-counter products can be ordered directly without prescription upload.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Most orders are delivered within 24-48 hours depending on your location and product availability.',
  },
  {
    question: 'Can I return or cancel my order?',
    answer:
      'You can cancel before dispatch. Returns are accepted for damaged or incorrect items according to our pharmacy return policy.',
  },
]

const FAQ = () => {
  return (
    <section className="bg-white px-6 py-14 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-slate-900">
                <span>{faq.question}</span>
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 text-teal-700 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ