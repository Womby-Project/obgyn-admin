import { useState } from 'react';
import Sidebar from '@/components/DashboardComponents/SidebarComponent';
import Header from '@/components/DashboardComponents/HeaderComponent';
import SearchIcon from '@mui/icons-material/Search';
import lim from '@/assets/rebeca.png';
import rebeca from '@/assets/lim.png';

import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMissedIcon from '@mui/icons-material/CallMissed';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const dummyChats = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  name: i % 2 === 0 ? 'Rebeca Lim' : 'Emma Wilson',
  img: i % 2 === 0 ? lim : rebeca,
  message: 'Hey there! How are you?',
  time: '2:45 PM',
}));

const dummyCalls = [
  { id: 1, name: 'Rebeca Lim', img: lim, type: 'missed', video: false, time: 'Today, 3:10 PM' },
  { id: 2, name: 'Emma Wilson', img: rebeca, type: 'received', video: true, time: 'Today, 1:55 PM' },
  { id: 3, name: 'Rebeca Lim', img: lim, type: 'received', video: false, time: 'Yesterday, 8:22 PM' },
  { id: 4, name: 'Emma Wilson', img: rebeca, type: 'missed', video: true, time: 'Yesterday, 4:12 PM' },
  { id: 5, name: 'Rebeca Lim', img: lim, type: 'received', video: true, time: 'Monday, 11:47 AM' },
];

const dummyMessagesMap: Record<number, { text: string; fromMe: boolean }[]> = {};
dummyChats.forEach(chat => {
  dummyMessagesMap[chat.id] = [
    { text: `Hello ${chat.name}, how are you?`, fromMe: false },
    { text: `I’m fine, thanks!`, fromMe: true },
    { text: `Wanna meet?`, fromMe: false },
  ];
});

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Chats' | 'Calls'>('Chats');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const chats = dummyChats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const calls = dummyCalls.filter(call => call.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedChat = dummyChats.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-screen">
    
      <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
  

        <main className="fixed top-10 left-[238px] right-0 bottom-0 overflow-hidden">
          <div className="h-full w-full overflow-y-auto p-6 scrollbar-hide flex">
            {/* Sidebar */}
            <div className="w-[310px] bg-white flex-shrink-0">
              <div className="flex justify-center mt-5 mb-4">
                <div className="relative w-full max-w-[260px]">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search Inbox"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-100 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="relative flex justify-center gap-x-2">
                {['Chats', 'Calls'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as 'Chats' | 'Calls')}
                    className={`w-1/2 pb-2 text-[15px] font-bold transition-colors duration-300 ${
                      activeTab === tab ? 'text-gray-700' : 'text-gray-500'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <div
                  className="absolute bottom-0 h-[2px] w-1/2 bg-gray-700 transition-all duration-500"
                  style={{ left: activeTab === 'Chats' ? '0%' : '50%' }}
                />
              </div>

              <div className="overflow-y-auto px-4 py-2 space-y-4 h-[calc(100%-100px)]">
                {activeTab === 'Chats' &&
                  chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition ${
                        selectedChatId === chat.id ? 'bg-gray-200' : ''
                      }`}
                    >
                      <img src={chat.img} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{chat.name}</div>
                        <div className="text-xs text-gray-500 truncate">{chat.message}</div>
                      </div>
                      <div className="text-[11px] text-gray-400">{chat.time}</div>
                    </div>
                  ))}

                {activeTab === 'Calls' &&
                  calls.map(call => (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img src={call.img} alt={call.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{call.name}</div>
                          <div className="flex items-center text-xs text-gray-500 gap-1 mt-0.5">
                            {call.type === 'missed' ? (
                              <CallMissedIcon className="text-red-500" fontSize="small" />
                            ) : (
                              <CallReceivedIcon className="text-green-500" fontSize="small" />
                            )}
                            <span>{call.time}</span>
                          </div>
                        </div>
                      </div>
                      <VideocamOutlinedIcon className="text-gray-400" fontSize="small" />
                    </div>
                  ))}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 ml-2 h-[673px] w-[600px] bg-white rounded-sm shadow-lg flex flex-col justify-between">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b pb-3 border-gray-300 px-4 pt-3">
                    <div className="flex items-center gap-3">
                      <img src={selectedChat.img} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="text-gray-900 font-semibold text-sm">{selectedChat.name}</div>
                    </div>
                    <div className="flex items-center gap-3 text-[#E46B64]">
                      <VideocamOutlinedIcon />
                      <MoreHorizOutlinedIcon />
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {dummyMessagesMap[selectedChat.id].map((msg, idx) => {
                      const isFromMe = msg.fromMe;
                      const alignment = isFromMe ? 'justify-end' : 'justify-start';
                      const dotSide = isFromMe ? 'left' : 'right';
                      const bubbleColor = isFromMe
                        ? 'bg-[#E46B64] text-white'
                        : 'bg-gray-100 text-gray-800';
                      const showTime = idx === 0 || idx % 3 === 0;
                      const time = `${10 + (idx % 3)}:${(45 + idx * 2) % 60} PM`;

                      return (
                        <div key={idx}>
                          {showTime && (
                            <div className="flex justify-center text-xs text-gray-600 my-2">
                              <div className="bg-gray-300 text-gray-800 px-4 py-1 rounded-full">{time}</div>
                            </div>
                          )}
                          <div className={`group flex items-start ${alignment}`}>
                            {dotSide === 'left' && (
                              <MessageMenu />
                            )}
                            <div className="flex flex-col items-end">
                              <div className={`px-4 py-2 rounded-xl max-w-xs break-words ${bubbleColor}`}>
                                {msg.text}
                              </div>
                              {isFromMe && (
                                <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400">
                                  <DoneAllIcon style={{ color: '#E46B64' }} fontSize="small" />
                                  <span className="text-gray-900">Seen {time}</span>
                                </div>
                              )}
                            </div>
                            {dotSide === 'right' && <MessageMenu right />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="flex items-center gap-3 border-t border-gray-300 pt-3 px-4 pb-4">
                    {[AttachFileOutlinedIcon, InsertPhotoOutlinedIcon, CameraAltOutlinedIcon].map((Icon, idx) => (
                      <Icon key={idx} className="text-[#E46B64] cursor-pointer" />
                    ))}
                    <input
                      type="text"
                      placeholder="Type a message"
                      className="flex-1 px-3 py-2 text-sm border rounded-full border-gray-300 outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MessageMenu({ right = false }: { right?: boolean }) {
  return (
    <div
      className={`relative ${right ? 'ml-2' : 'mr-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
    >
      <MoreHorizOutlinedIcon className="text-gray-400 cursor-pointer" />
      <div
        className={`absolute top-full ${right ? 'right-0' : 'left-0'} mt-1 bg-white shadow-md rounded-md text-sm z-10 hidden group-hover:block`}
      >
        {['Report', 'Remove', 'Reply'].map((action, i) => (
          <button key={i} className="block px-4 py-2 w-full text-left hover:bg-gray-100">{action}</button>
        ))}
      </div>
    </div>
  );
}
