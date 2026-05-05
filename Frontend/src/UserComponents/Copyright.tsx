import mednexuxLogo from '../assets/Mednexux.png'

const Copyright = () => {
    return (
      <div className="border-t border-teal-800 bg-teal-700">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-2 px-8 py-4 text-center text-xs text-white/90">
          <img alt="MedNexus logo" className="h-10 w-auto object-contain" src={mednexuxLogo} />
          <p>
            &copy; 2026 | All rights reserved | Designed by{' '}
            <span className="underline">Aaloka Poudel</span> | <span className="underline">Privacy Policy</span> |{' '}
            <span className="underline">Terms of Service</span>
          </p>
        </div>
      </div>
    )
  }
  
  export default Copyright