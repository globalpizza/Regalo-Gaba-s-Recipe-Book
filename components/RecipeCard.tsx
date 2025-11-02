import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
    recipe: Recipe;
    onSelect: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
    return (
        <div 
            className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out group"
            onClick={onSelect}
        >
            <img 
                src={recipe.image_url || 'https://picsum.photos/400/300'} 
                alt={recipe.title} 
                className="w-full h-48 object-cover"
            />
            <div className="p-5">
                <h3 className="text-xl font-serif font-bold text-brand-text group-hover:text-brand-pink-dark transition-colors duration-300">{recipe.title}</h3>
            </div>
        </div>
    );
};

export default RecipeCard;