const ContactHero = () => {
  return (
    <section
      className="relative overflow-hidden px-4 py-14 text-white md:px-8 md:py-16 lg:px-[80px]"
      style={{
        background: 'linear-gradient(180deg, #7FCBC3 0%, #4DB6AB 48%, #2f7570 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl md:h-64 md:w-64"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative mx-auto max-w-[1280px] text-center md:text-left">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/80 sm:text-xs">
          We are here to help
        </p>
        <h1 className="mt-3 text-[1.85rem] font-bold tracking-tight sm:text-[2.15rem] md:text-[2.35rem]">
          Contact Us
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-white/90 md:mx-0 md:text-base">
          Reach out for orders, product questions, vendor partnerships, or support. Our team usually responds
          within 24 hours.
        </p>
      </div>
    </section>
  )
}

export default ContactHero
