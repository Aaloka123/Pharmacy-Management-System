const ChatbotButton = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/20"
  >
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.625 9.75h6.75M8.625 13.5h4.5m8.856-1.636c.056.52.084 1.044.084 1.568 0 2.035-.422 3.973-1.183 5.73a2.25 2.25 0 0 1-2.086 1.338H5.204a2.25 2.25 0 0 1-2.086-1.338A13.968 13.968 0 0 1 1.935 13.5c0-.524.028-1.048.084-1.568A13.965 13.965 0 0 1 1.935 10.5c0-2.035.422-3.973 1.183-5.73A2.25 2.25 0 0 1 5.204 3.432h13.592a2.25 2.25 0 0 1 2.086 1.338A13.968 13.968 0 0 1 22.065 10.5c0 .524-.028 1.048-.084 1.568Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
)

export default ChatbotButton
