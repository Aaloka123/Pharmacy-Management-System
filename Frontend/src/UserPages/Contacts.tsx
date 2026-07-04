import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import ContactForm from '../UserComponents/ContactForm'
import ContactHero from '../UserComponents/ContactHero'
import ContactBottom from '../UserComponents/ContactBottom'
import FadeInOnScroll from '../components/FadeInOnScroll'
import { FiMail, FiMapPin, FiPhoneCall } from 'react-icons/fi'

const contactDetails = [
  {
    icon: FiPhoneCall,
    title: '+977 9876543212, 01 - 1234567',
    subtitle: 'Contact us anytime',
  },
  {
    icon: FiMail,
    title: 'MedNexus@gmail.com',
    subtitle: 'Send your query anytime',
  },
  {
    icon: FiMapPin,
    title: 'Dhapakhel, Lalitpur',
    subtitle: 'Visit us anytime',
  },
]

const Contacts = () => {
  return (
    <div className="bg-[#F8FAFC]">
      <Header />
      <ContactHero />

      <main className="px-4 py-12 md:px-8 md:py-14 lg:px-[80px]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
          <FadeInOnScroll>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Get in touch</h2>
              <p className="mt-2 max-w-md text-[15px] leading-7 text-slate-600">
                For orders, products, or vendor partnerships, contact our team anytime.
              </p>

              <div className="mt-8 space-y-4">
                {contactDetails.map(({ icon: Icon, title, subtitle }) => (
                  <div
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                    key={title}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-slate-900">{title}</p>
                      <p className="mt-1 text-[14px] text-slate-500">{subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={100}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <ContactForm />
            </div>
          </FadeInOnScroll>
        </div>
      </main>

      <ContactBottom />
      <Footer />
      <Copyright />
    </div>
  )
}

export default Contacts
