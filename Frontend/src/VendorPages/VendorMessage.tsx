import Navbar from '../VendorComponents/Navbar'
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain'
import MessagingPage from '../components/MessagingPage'

const VendorMessage = () => (
  <VendorLayout>
    <Navbar />
    <VendorMain>
      <FadeInOnScroll>
        <MessagingPage mode="vendor" />
      </FadeInOnScroll>
    </VendorMain>
  </VendorLayout>
)

export default VendorMessage
