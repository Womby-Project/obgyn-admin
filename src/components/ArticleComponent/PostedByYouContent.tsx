
import ArticleCard, { type Article } from './ArticleCard';

const articles: Article[] = [
    { id: 4, title: 'My Guide to a Healthy First Trimester', description: 'Tips and advice from personal experience on navigating the first three months of pregnancy.', imageUrl: 'https://placehold.co/600x400/E9AEA4/FFFFFF?text=Wombly', views: 156, author: 'Dr. Evie Smith', publishedDate: 'August 5, 2025' },
    { id: 5, title: 'Benefits of Meditation During Pregnancy', description: 'How mindfulness and meditation can reduce stress and improve well-being for expectant mothers.', imageUrl: 'https://placehold.co/600x400/E9AEA4/FFFFFF?text=Wombly', views: 95, author: 'Dr. Evie Smith', publishedDate: 'July 18, 2025' },
];

export default function PostedByYouContent({ onViewArticle }: { onViewArticle: (article: Article) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => <ArticleCard key={article.id} article={article} variant="posted" onViewArticle={onViewArticle} />)}
        </div>
    );
}

