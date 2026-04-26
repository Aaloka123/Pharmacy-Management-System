import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import ContactForm from '../UserComponents/ContactForm'
import { FiMail, FiMapPin, FiPhoneCall } from 'react-icons/fi'

const Contacts = () => {
  return (
    <div className="bg-white">
      <Header />
      <main className="px-[80px] py-12">
        <section className="p-2 md:p-4">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contact Us</h1>
              <p className="mt-3 max-w-md text-[15px] leading-7 text-slate-600">
                For orders, products, or vendor partnerships, contact our team anytime.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-3">
                  <FiPhoneCall className="mt-0.5 h-5 w-5 text-teal-700" />
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">+977 9876543212, 01 - 1234567</p>
                    <p className="mt-1 text-[14px] text-slate-500">Contact us anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiMail className="mt-0.5 h-5 w-5 text-teal-700" />
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">MedNexus@gmail.com</p>
                    <p className="mt-1 text-[14px] text-slate-500">Send your query anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-0.5 h-5 w-5 text-teal-700" />
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">Dhapakhel, Lalitpur</p>
                    <p className="mt-1 text-[14px] text-slate-500">Visit us anytime</p>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Contacts