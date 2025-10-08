import React, { useState } from 'react';
import ArticleHeader from '@/components/ArticleComponent/ArticleHeader';
import ArticleTabs from '@/components/ArticleComponent/ArticleTabs';
import AllArticlesContent from '@/components/ArticleComponent/AllArticlesContent';
import PostedByYouContent from '@/components/ArticleComponent/PostedByYouContent';
import ArchiveContent from '@/components/ArticleComponent/ArchiveContent';
import WriteArticlePage from '@/components/ArticleComponent/WriteArticle';
import ArticleViewPage from '@/components/ArticleComponent/ArticleViewPage'; // Assuming ArticleViewPage is in the same directory

// --- TYPE DEFINITION ---
export interface Article {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  views: number;
  author?: string;
  source?: string;
  publishedDate?: string;
  archivedDate?: string;
  content?: string[];
  originalSourceInfo?: string;
  originalArticleLink?: string;
  fetchedDate?: string;
}

export type ArticleView = 'All articles' | 'Posted by You' | 'Archive';

// --- MAIN PAGE COMPONENT ---
export default function OBGYNArticlePage() {
  const [activeTab, setActiveTab] = useState<ArticleView>('All articles');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  const handleViewArticle = (article: Article) => setSelectedArticle(article);
  const handleBackToList = () => setSelectedArticle(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'All articles':
        return <AllArticlesContent onViewArticle={handleViewArticle} />;
      case 'Posted by You':
        return <PostedByYouContent onViewArticle={handleViewArticle} />;
      case 'Archive':
        return <ArchiveContent onViewArticle={handleViewArticle} />;
      default:
        return <AllArticlesContent onViewArticle={handleViewArticle} />;
    }
  };

  // --- CONDITIONAL RENDERING ---
  if (isWriting) return <WriteArticlePage onBack={() => setIsWriting(false)} />;
  if (selectedArticle) return <ArticleViewPage article={selectedArticle} onBack={handleBackToList} />;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="container mx-auto space-y-6">
            <ArticleHeader onWriteArticle={() => setIsWriting(true)} />
            <ArticleTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div>{renderContent()}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
