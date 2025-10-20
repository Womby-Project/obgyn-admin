import { useState } from "react";
import { toast, Toaster } from "sonner";
import ArticleHeader from "@/components/ArticleComponent/ArticleHeader";
import ArticleTabs from "@/components/ArticleComponent/ArticleTabs";
import AllArticlesContent from "@/components/ArticleComponent/AllArticlesContent";
import PostedByYouContent from "@/components/ArticleComponent/PostedByYouContent";
import ArchiveContent from "@/components/ArticleComponent/ArchiveContent";
import WriteArticlePage from "@/components/ArticleComponent/WriteArticle";
import ArticleViewPage from "@/components/ArticleComponent/ArticleViewPage";
import AddArticleModal from "@/components/modals/AddArticleModal";

export interface Article {
  id: string;
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

export type ArticleView = "All articles" | "Posted by You" | "Archive";

export default function OBGYNArticlePage() {
  const [activeTab, setActiveTab] = useState<ArticleView>("All articles");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [, setArticles] = useState<Article[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleViewArticle = (article: Article) => setSelectedArticle(article);
  const handleBackToList = () => setSelectedArticle(null);

  // --- Add Article Handler ---
  const handleAddArticle = async (url: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      const textResponse = await res.text();

      if (!res.ok) {
        if (textResponse.includes("duplicate key value")) {
          throw new Error("This article already exists in your library!");
        }
        throw new Error(`Server error: ${res.status}`);
      }

      const data = JSON.parse(textResponse);
      if (data.article) {
        setArticles((prev) => [data.article, ...prev]);
        return "success";
      } else {
        throw new Error("No article data returned");
      }
    } catch (err: any) {
      console.error("Error adding article:", err);
      throw err;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "All articles":
        return <AllArticlesContent onViewArticle={handleViewArticle} />;
      case "Posted by You":
        return <PostedByYouContent onViewArticle={handleViewArticle} />;
      case "Archive":
        return <ArchiveContent onViewArticle={handleViewArticle} />;
      default:
        return <AllArticlesContent onViewArticle={handleViewArticle} />;
    }
  };

  if (isWriting)
    return <WriteArticlePage onBack={() => setIsWriting(false)} />;
  if (selectedArticle)
    return (
      <ArticleViewPage article={selectedArticle} onBack={handleBackToList} />
    );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* ✅ Global toast for this page */}
      <Toaster richColors position="top-right" offset={70} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="container mx-auto space-y-6">
            {/* ✅ Toast + Modal trigger handled here */}
            <ArticleHeader
              onWriteArticle={() => setIsWriting(true)}
              onAddArticle={() => {
               
                setShowAddModal(true);
              }}
            />

            <ArticleTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div>{renderContent()}</div>
          </div>
        </main>
      </div>

      {/* ✅ Add Article Modal */}
      <AddArticleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (url) => {
          try {
            const result = await handleAddArticle(url);
            if (result === "success") {
              toast.success("✅ Article added to draft successfully!");
            }
          } catch (err: any) {
            toast.error(err.message || "❌ Failed to add article.");
          }
        }}
      />
    </div>
  );
}
