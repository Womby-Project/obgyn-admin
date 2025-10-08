

// --- SVG ICONS ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const DiscardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

// --- PROPS INTERFACE ---
interface WriteArticlePageProps {
  onBack: () => void;
}

// --- WRITE ARTICLE PAGE COMPONENT ---
export default function WriteArticlePage({ onBack }: WriteArticlePageProps) {
    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
                    <BackIcon />
                    <span>Back to Library</span>
                </button>
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Write Article</h2>
                            <p className="text-gray-500 mt-1">Fill in the information below.</p>
                        </div>
                        <div className="border-t border-gray-200 pt-6 space-y-4">
                             <div>
                                <label htmlFor="article-title" className="block text-sm font-bold text-gray-700 mb-1">Article Details</label>
                                <input
                                    type="text"
                                    id="article-title"
                                    placeholder="Enter a descriptive title for your article"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none placeholder-gray-400 text-sm"
                                />
                            </div>
                             <div>
                                <label htmlFor="article-content" className="block text-sm font-bold text-gray-700 mb-1">Content</label>
                                <textarea
                                    id="article-content"
                                    rows={12}
                                    placeholder="Enter your article content here"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none placeholder-gray-400 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <DiscardIcon />
                        <span>Discard</span>
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-[#E46B64] rounded-lg hover:bg-[#D15B54]">
                        <PostIcon />
                        <span>Post</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
