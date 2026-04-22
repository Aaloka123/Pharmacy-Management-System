import { FiMail, FiPhone } from 'react-icons/fi'

const ContactForm = () => {
  return (
    <form className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900">Get in Touch</h2>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <input
          className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
          placeholder="Full Name"
          type="text"
        />
        <input
          className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
          placeholder="Phone"
          type="tel"
        />
        <div className="md:col-span-2">
          <input
            className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
            placeholder="Email"
            type="email"
          />
        </div>
        <div className="md:col-span-2">
          <textarea
            className="min-h-[90px] w-full resize-none border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
            placeholder="Send Message"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-teal-800"
          type="submit"
        >
          <FiMail className="h-4 w-4" />
          Send Message
        </button>
        <p className="inline-flex items-center gap-2 text-[13px] text-slate-500 md:justify-end">
          <FiPhone className="h-4 w-4" />
          We usually reply within 24 hours.
        </p>
      </div>
    </form>
  )
}

export default ContactForm