
import ArticleCard, { type Article } from './ArticleCard';

const articles: Article[] = [
    { id: 1, title: 'The Importance of Prenatal Care', description: 'Regular prenatal check-ups help monitor both the mother\'s and baby\'s health...', imageUrl: 'https://placehold.co/600x400/E9AEA4/FFFFFF?text=Wombly', views: 42, source: 'Mayo Clinic', publishedDate: 'August 1, 2025' },
    { id: 2, title: 'Coping with Postpartum Depression', description: 'Understanding the signs and learning strategies to manage postpartum depression effectively.', imageUrl: 'https://placehold.co/600x400/E9AEA4/FFFFFF?text=Wombly', views: 78, source: 'WebMD', publishedDate: 'July 30, 2025' },
    { id: 3, title: 'Nutritional Needs During Pregnancy', description: 'A guide to essential nutrients for a healthy pregnancy for you and your baby.', imageUrl: 'https://placehold.co/600x400/E9AEA4/FFFFFF?text=Wombly', views: 105, author: 'Dr. Ashley Morales', publishedDate: 'July 25, 2025' },
];

export default function AllArticlesContent({ onViewArticle }: { onViewArticle: (article: Article) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => <ArticleCard key={article.id} article={article} variant="all" onViewArticle={onViewArticle} />)}
        </div>
    );
}
