import { useSearchParams } from 'react-router-dom'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import MessagingPage from '../components/MessagingPage'

const UserMessage = () => {
  const [searchParams] = useSearchParams()
  const vendorIdParam = searchParams.get('vendorId')
  const initialVendorId =
    vendorIdParam && !Number.isNaN(Number(vendorIdParam)) ? Number(vendorIdParam) : null

  return (
    <>
      <Header />
      <main>
        <MessagingPage initialVendorId={initialVendorId} mode="user" />
      </main>
      <Footer />
      <Copyright />
    </>
  )
}

export default UserMessage
