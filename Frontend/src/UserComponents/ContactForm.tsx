import { useState } from 'react'
import { FiMail, FiPhone } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { submitContactMessage } from '../lib/contactApi'
import { isValidPhoneNumber, phoneInputProps, sanitizePhoneInput } from '../lib/phoneUtils'

const ContactForm = () => {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName) {
      toast.error('Please enter your full name.')
      return
    }
    if (!trimmedEmail) {
      toast.error('Please enter your email.')
      return
    }
    if (!isValidPhoneNumber(phone)) {
      toast.error('Phone number must be exactly 10 digits.')
      return
    }
    if (!trimmedMessage) {
      toast.error('Please enter a message.')
      return
    }

    setLoading(true)
    try {
      await submitContactMessage({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        message: trimmedMessage,
      })
      toast.success('Message has been sent.', { autoClose: 3000 })
      setFullName('')
      setPhone('')
      setEmail('')
      setMessage('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send your message.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Send a message</h2>
        <p className="mt-1 text-sm text-slate-500">Fill in the form and we will get back to you soon.</p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <input
          className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Full Name"
          type="text"
          value={fullName}
        />
        <input
          className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
          onChange={(event) => setPhone(sanitizePhoneInput(event.target.value))}
          placeholder="10 digit number"
          value={phone}
          {...phoneInputProps}
        />
        <div className="md:col-span-2">
          <input
            className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            value={email}
          />
        </div>
        <div className="md:col-span-2">
          <textarea
            className="min-h-[90px] w-full resize-none border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-700"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Send Message"
            value={message}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-700 px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          <FiMail className="h-4 w-4" />
          {loading ? 'Sending...' : 'Send Message'}
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
