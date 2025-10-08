
import type { Article } from '@/pages/OBGYN/OBGYNArticlePage';

// --- SVG ICONS (Self-contained for this component) ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const FetchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SourceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const ViewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const CopyrightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

interface ArticleViewPageProps {
    article: Article;
    onBack: () => void;
}

export default function ArticleViewPage({ article, onBack }: ArticleViewPageProps) {
    const fullArticleData = { ...article, content: ['Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur erat ipsum, euismod id neque a, ornare porta arcu. Donec sollicitudin sem lacus, pulvinar magna in sit amet, maximus metus...'], fetchedDate: 'August 2, 2025', originalSourceInfo: 'This article was originally published by Mayo Clinic. Content has been adapted for educational purposes.', originalArticleLink: '#' };
    return (
             <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                <div className="max-w mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"><BackIcon /><span>Back to Library</span></button>
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5"><CalendarIcon /><span>Published: {fullArticleData.publishedDate}</span></div>
                            {fullArticleData.source && (
                                <div className="flex items-center gap-1.5"><FetchIcon /><span>Fetched: {fullArticleData.fetchedDate}</span></div>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{fullArticleData.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                            {fullArticleData.source ? (
                                <div className="flex items-center gap-1.5"><SourceIcon /><span>Source: {fullArticleData.source}</span></div>
                            ) : fullArticleData.author ? (
                                <div className="flex items-center gap-1.5"><UserIcon /><span>Author: {fullArticleData.author}</span></div>
                            ) : null}
                            <div className="flex items-center gap-1.5"><ViewsIcon /><span>{fullArticleData.views} Views</span></div>
                        </div>
                        <div className="pt-4"><img src={fullArticleData.imageUrl} alt={fullArticleData.title} className="w-full rounded-xl object-cover"/></div>
                        <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6 pt-6">{fullArticleData.content.map((p, i) => <p key={i}>{p}</p>)}</div>
                        
                        {fullArticleData.source && (
                          <div className="mt-12 pt-8">
                              <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start gap-4">
                                  <CopyrightIcon />
                                  <div>
                                      <h4 className="font-bold text-gray-800">Source & Copyright</h4>
                                      <p className="text-sm text-gray-600 mt-1">{fullArticleData.originalSourceInfo}</p>
                                      <a href={fullArticleData.originalArticleLink} className="text-sm font-semibold text-red-500 hover:text-red-700 mt-3 inline-flex items-center gap-1.5">
                                          <span>Read original article</span>
                                          <ArrowRightIcon />
                                      </a>
                                  </div>
                              </div>
                          </div>
                        )}
                    </div>
                </div>
            </main>
    );
}
