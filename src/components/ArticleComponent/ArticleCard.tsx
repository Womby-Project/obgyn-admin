

// --- TYPE DEFINITION ---
export interface Article {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  views: number;
  author?: string; // For "Posted By You" & "All Articles"
  source?: string; // For "All Articles"
  publishedDate?: string;
  archivedDate?: string;
}

// --- PROPS INTERFACE ---
interface ArticleCardProps {
  article: Article;
  variant: 'all' | 'posted' | 'archived';
  onViewArticle: (article: Article) => void;
}

// --- SVG ICONS ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SourceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ViewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;


// --- MAIN CARD COMPONENT ---
export default function ArticleCard({ article, variant, onViewArticle }: ArticleCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => onViewArticle(article)}>
      <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover" />
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-md mb-2">{article.title}</h3>
        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          {(variant === 'all' || variant === 'posted') && article.author && (<div className="flex items-center gap-1.5"><UserIcon /><span>By: {article.author}</span></div>)}
          {variant === 'all' && article.source && (<div className="flex items-center gap-1.5"><SourceIcon /><span>{article.source}</span></div>)}
          {(variant === 'all' || variant === 'posted') && article.publishedDate && (<div className="flex items-center gap-1.5"><CalendarIcon /><span>{`Published: ${article.publishedDate}`}</span></div>)}
          {variant === 'archived' && article.archivedDate && (<div className="flex items-center gap-1.5"><CalendarIcon /><span>{`Archived: ${article.archivedDate}`}</span></div>)}
        </div>
        <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">{article.description}</p>
        <div className="text-xs text-gray-500 flex items-center gap-1.5"><ViewsIcon /><span>{article.views} Views</span></div>
      </div>
      {variant === 'posted' && (
        <div className="border-t border-gray-200 bg-gray-50 p-3 text-center">
            <button className="flex items-center justify-center w-full gap-2 text-sm font-medium text-gray-600 hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                <ArchiveIcon />
                Archive
            </button>
        </div>
      )}
    </div>
  );
}
