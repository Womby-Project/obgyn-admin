// components/RightChatPanel.tsx

import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import AttachmentIcon from '@mui/icons-material/Attachment';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

export default function RightChatPanel() {
  return (
    <div className="flex flex-col w-[] h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="/path-to-avatar.jpg"
            alt="Patient"
            className="w-10 h-10 rounded-full"
          />
          <span className="font-semibold text-gray-800 text-sm">
            Patient Name 2
          </span>
        </div>
        <div className="flex items-center gap-4">
          <VideocamOutlinedIcon className="text-red-400" />
          <MoreVertIcon className="text-gray-500" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Incoming message */}
        <div className="flex gap-2 items-start">
          <img
            src="/path-to-avatar.jpg"
            className="w-8 h-8 rounded-full mt-1"
            alt=""
          />
          <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm max-w-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </div>
        </div>

        {/* Center time divider */}
        <div className="flex items-center justify-center text-xs text-gray-500 my-2">
          <span className="w-full border-t border-gray-200"></span>
          <span className="px-2">4:45 pm</span>
          <span className="w-full border-t border-gray-200"></span>
        </div>

        {/* Outgoing message */}
        <div className="flex justify-end">
          <div className="bg-red-300 text-white px-4 py-2 rounded-xl text-sm max-w-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            <div className="text-[10px] text-right mt-1">✓✓ Seen 4:47 pm</div>
          </div>
        </div>
      </div>

      {/* Input section */}
      <div className="flex items-center gap-3 px-6 py-3 border-t border-gray-200">
        <AttachmentIcon className="text-gray-500 cursor-pointer" />
        <InsertPhotoIcon className="text-gray-500 cursor-pointer" />
        <input
          type="text"
          placeholder="Type a message"
          className="flex-1 text-sm p-2 border border-gray-300 rounded-full outline-none"
        />
        <EmojiEmotionsIcon className="text-gray-500 cursor-pointer" />
      </div>
    </div>
  );
}
