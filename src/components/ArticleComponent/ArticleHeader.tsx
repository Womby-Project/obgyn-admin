
import { Icon } from '@iconify/react';

interface ArticleHeaderProps {
  onWriteArticle: () => void;
}

export default function ArticleHeader({ onWriteArticle }: ArticleHeaderProps) {
  return (
<div className="flex flex-col gap-6">
  {/* Top Section: Title and Description */}
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
    <p className="text-gray-600 mt-1">
      Manage, create, and share informative content with your community.
    </p>
  </div>

  {/* Bottom Section: Controls */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    {/* Left Controls (Search + Sort) */}
    <div className="flex items-center w-full md:w-auto gap-3">
      {/* Search Bar */}
      <div className="relative w-full md:w-130">
        <Icon
          icon="solar:magnifer-linear"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
        />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none placeholder-gray-400 text-sm"
        />
      </div>

      {/* Sort Button */}
      <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition text-sm text-gray-600 font-medium">
        <span>Sort</span>
        <Icon
          icon="fluent:arrow-sort-20-filled"
          className="h-5 w-5"
        />
      </button>
    </div>

    {/* Write Article Button */}
    <button
      onClick={onWriteArticle}
      className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-[#E46B64] text-white rounded-lg hover:bg-[#E9AEA4] transition-colors font-semibold text-sm shadow-sm"
    >
      <Icon icon="material-symbols:add-rounded" className="h-5 w-5" />
      <span>Write Article</span>
    </button>
  </div>
</div>

  );
}

