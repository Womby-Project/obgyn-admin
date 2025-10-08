
import ArticleCard, { type Article } from './ArticleCard';

const articles: Article[] = [
    { id: 6, title: 'Old Article on Prenatal Vitamins', description: 'An older article discussing the basic requirements for prenatal vitamins.', imageUrl: 'https://placehold.co/600x400/E9AEA4/FFFFFF?text=Wombly', views: 25, archivedDate: 'June 1, 2025' },
];

export default function ArchiveContent({ onViewArticle }: { onViewArticle: (article: Article) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => <ArticleCard key={article.id} article={article} variant="archived" onViewArticle={onViewArticle} />)}
        </div>
    );
}

