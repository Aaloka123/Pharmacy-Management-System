import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Navbar from '../VendorComponents/Navbar';
import MednexuxLogo from '../assets/Mednexux.png';

type Attachment = {
  name: string;
  url: string;
  kind: 'image' | 'pdf';
};

type ChatMessage = {
  id: number;
  sender: 'vendor' | 'user';
  text: string;
  timestamp: string;
  attachment?: Attachment;
};

type ChatUser = {
  id: number;
  name: string;
  avatar: string;
  email: string;
  messages: ChatMessage[];
};

const vendorProfile = {
  name: 'Mednexux Vendor',
  avatar: 'MV',
  avatarImage: MednexuxLogo,
};

const getAvatarColorClass = (chatId: number) => {
  if (chatId === -1) return 'bg-blue-500';
  if (chatId === 1) return 'bg-teal-600';
  if (chatId === 2) return 'bg-violet-600';
  if (chatId === 3) return 'bg-amber-600';
  return 'bg-slate-400';
};

const aiChat: ChatUser = {
  id: -1,
  name: 'Chatbot',
  avatar: 'AI',
  email: 'ai-assistant@mednexux.local',
  messages: [
    {
      id: 1,
      sender: 'user',
      text: 'Hi, I need quick help with an order.',
      timestamp: 'Now',
    },
    {
      id: 2,
      sender: 'vendor',
      text: 'Hello! I am your AI assistant. Backend response will be connected later.',
      timestamp: 'Now',
    },
  ],
};

const initialChats: ChatUser[] = [
  {
    id: 1,
    name: 'Aaloka Poudel',
    avatar: 'AP',
    email: 'aaloka.poudel10@gmail.com',
    messages: [
      { id: 101, sender: 'user', text: 'Namaste, can I get invoice for my last order?', timestamp: '10:15 AM' },
      { id: 102, sender: 'vendor', text: 'Yes, I will share it shortly.', timestamp: '10:18 AM' },
    ],
  },
  {
    id: 2,
    name: 'Nivesh Shrestha',
    avatar: 'NS',
    email: 'nivesh.shrestha94@gmail.com',
    messages: [
      { id: 201, sender: 'user', text: 'Please confirm if order is shipped.', timestamp: '09:02 AM' },
      { id: 202, sender: 'vendor', text: 'Your order is shipped today.', timestamp: '09:10 AM' },
    ],
  },
  {
    id: 3,
    name: 'Sita Sharma',
    avatar: 'SS',
    email: 'sita.sharma@email.com',
    messages: [
      { id: 301, sender: 'user', text: 'I need product leaflet PDF.', timestamp: 'Yesterday' },
      { id: 302, sender: 'vendor', text: 'Sure, please find it attached.', timestamp: 'Yesterday' },
    ],
  },
];

const Message = () => {
  const [chats, setChats] = useState<ChatUser[]>(initialChats);
  const [selectedUserId, setSelectedUserId] = useState<number>(initialChats[0]?.id ?? 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);

  const allChats = useMemo(() => [aiChat, ...chats], [chats]);

  const filteredUserChats = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => chat.name.toLowerCase().includes(query));
  }, [chats, searchTerm]);

  const filteredChats = useMemo(() => [aiChat, ...filteredUserChats], [filteredUserChats]);

  const selectedChat = allChats.find((chat) => chat.id === selectedUserId) ?? null;

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPdf) {
      window.alert('Please upload only image or PDF files.');
      return;
    }

    setPendingAttachment({
      name: file.name,
      url: URL.createObjectURL(file),
      kind: isImage ? 'image' : 'pdf',
    });
    event.target.value = '';
  };

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedChat) return;
    if (!messageText.trim() && !pendingAttachment) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: 'vendor',
      text: messageText.trim(),
      timestamp: 'Now',
      attachment: pendingAttachment ?? undefined,
    };

    setChats((prev) =>
      prev.map((chat) => (chat.id === selectedChat.id ? { ...chat, messages: [...chat.messages, newMessage] } : chat)),
    );
    setMessageText('');
    setPendingAttachment(null);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Message</h1>

        <section className="mt-5 grid h-[calc(100vh-100px)] min-h-[84vh] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[300px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-4 py-4">
              <h2 className="text-lg font-bold text-slate-900">User Conversations</h2>
            </div>

            <div className="p-3">
              <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              >
                <path
                  d="m21 21-4.35-4.35M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search user..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-600"
              />
            </div>
            </div>

            <div className="space-y-1 px-1 pb-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedUserId(chat.id)}
                  className={`w-full px-3 py-2 text-left transition ${
                    selectedUserId === chat.id
                      ? 'bg-teal-50'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`aspect-square h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColorClass(
                        chat.id,
                      )}`}
                    >
                      {chat.avatar}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {chat.name}{' '}
                        {chat.id === -1 ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Assistant
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {chat.messages[chat.messages.length - 1]?.text || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col bg-white">
            {selectedChat ? (
              <>
                <div className="border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColorClass(selectedChat.id)}`}>
                        {selectedChat.avatar}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedChat.name}</p>
                      {selectedChat.id === -1 ? (
                        <p className="text-xs text-slate-500">AI Assistant</p>
                      ) : selectedChat.name === 'Aaloka Poudel' ? (
                        <p className="text-xs font-semibold text-emerald-600">Online</p>
                      ) : (
                        <p className="text-xs text-slate-500">Last active today</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4">
                  {selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${message.sender === 'vendor' ? 'justify-end' : ''}`}
                    >
                      {message.sender === 'user' ? (
                        <span className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColorClass(selectedChat.id)}`}>
                          {selectedChat.avatar}
                        </span>
                      ) : null}

                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 ${
                          message.sender === 'vendor'
                            ? 'bg-teal-50 shadow-sm'
                            : 'border border-slate-200 bg-white'
                        }`}
                      >
                        {message.attachment ? (
                          <div>
                            {message.attachment.kind === 'image' ? (
                              <a href={message.attachment.url} target="_blank" rel="noreferrer" className="block">
                                <img
                                  src={message.attachment.url}
                                  alt={message.attachment.name}
                                  className="max-h-40 w-auto rounded-md border border-slate-200 object-cover"
                                />
                              </a>
                            ) : (
                              <a href={message.attachment.url} target="_blank" rel="noreferrer" className="text-xs underline text-slate-600">
                                View PDF: {message.attachment.name}
                              </a>
                            )}
                          </div>
                        ) : null}
                        {message.text ? (
                          <p className={`text-sm font-medium text-slate-600 ${message.attachment ? 'mt-2' : ''}`}>
                            {message.text}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] font-medium text-slate-400">{message.timestamp}</p>
                      </div>

                      {message.sender === 'vendor' ? (
                        <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white p-1">
                          <img
                            src={vendorProfile.avatarImage}
                            alt={vendorProfile.name}
                            className="h-full w-full rounded-full object-contain"
                          />
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-3">
                  {pendingAttachment ? (
                    pendingAttachment.kind === 'image' ? (
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-12 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                          <img
                            src={pendingAttachment.url}
                            alt={pendingAttachment.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingAttachment(null)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                        >
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                        <span>Attached PDF: {pendingAttachment.name}</span>
                        <button type="button" onClick={() => setPendingAttachment(null)} className="text-rose-600">
                          Remove file
                        </button>
                      </div>
                    )
                  ) : null}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-teal-600"
                    />
                    <label className="cursor-pointer rounded-lg border border-slate-300 bg-white p-3 text-slate-500 transition hover:bg-slate-100">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.7"
                        />
                        <path
                          d="m8 15 3-3 2 2 3-4"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.7"
                        />
                        <circle cx="9" cy="9" r="1" fill="currentColor" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleAttachmentChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Select a user to start messaging.</div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
};

export default Message;