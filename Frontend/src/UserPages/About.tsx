import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Aboutuscontent from '../UserComponents/Aboutuscontent'

const About = () => {
  return (
    <div className="bg-slate-50">
      <Header />
      <Aboutuscontent />
      <Footer />
      <Copyright />
    </div>
  )
}

export default About