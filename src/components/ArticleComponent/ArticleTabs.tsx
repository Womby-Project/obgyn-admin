
import type { ArticleView } from '@/pages/OBGYN/OBGYNArticlePage';

const tabs: ArticleView[] = ['All articles', 'Posted by You', 'Archive'];

interface ArticleTabsProps {
  activeTab: ArticleView;
  setActiveTab: (tab: ArticleView) => void;
}

export default function ArticleTabs({ activeTab, setActiveTab }: ArticleTabsProps) {
  return (
    <div className="bg-gray-100 p-1.5 rounded-xl border border-gray-200">
      <nav className="flex space-x-2" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 whitespace-nowrap py-2 px-4 text-center font-semibold text-sm rounded-lg transition-all duration-200
              ${
                activeTab === tab
                  ? 'bg-white text-[#222227] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}

