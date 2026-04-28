import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Aboutuscontent from '../UserComponents/Aboutuscontent'
import AboutCTA from '../UserComponents/AboutCTA'
import AboutText from '../UserComponents/AboutText'

const About = () => {
  return (
    <div className="bg-white">
      <Header />
      <Aboutuscontent />
      <AboutCTA />
      <AboutText />
      <Footer />
      <Copyright />
    </div>
  )
}

export default About