import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeSuggestion } from './types';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';
import Chatbot from './components/Chatbot';
import { PlusIcon, HeartIcon } from './components/Icons';

// Initial data for a better first experience
const INITIAL_RECIPES: Recipe[] = [
    { id: '1', title: 'Tostada de Aguacate con Huevo', ingredients: '1 rebanada de pan\n1/2 aguacate\n1 huevo\nSal y pimienta', steps: '1. Tostar el pan.\n2. Machacar el aguacate y untarlo en la tostada.\n3. Freír o pochar un huevo y colocarlo encima.\n4. Sazonar con sal y pimienta.', imageUrl: 'https://picsum.photos/seed/avocado/400/300' },
    { id: '2', title: 'Pasta Clásica con Tomate', ingredients: '200g de pasta\n400g de tomates en lata\n1 diente de ajo\nAceite de oliva\nAlbahaca', steps: '1. Cocinar la pasta según las instrucciones del paquete.\n2. Saltear el ajo en aceite de oliva.\n3. Añadir los tomates y cocinar a fuego lento durante 15 minutos.\n4. Mezclar con la pasta y decorar con albahaca.', imageUrl: 'https://picsum.photos/seed/pasta/400/300' },
    { id: '3', title: 'Galletas con Chips de Chocolate', ingredients: '2 1/4 tazas de harina\n1 cdta. de bicarbonato de sodio\n1 taza de mantequilla\n3/4 taza de azúcar\n3/4 taza de azúcar moreno\n2 huevos\n2 tazas de chips de chocolate', steps: '1. Precalentar el horno a 190°C (375°F).\n2. Mezclar los ingredientes secos.\n3. Batir la mantequilla y los azúcares, luego añadir los huevos.\n4. Añadir gradualmente los ingredientes secos.\n5. Incorporar los chips de chocolate.\n6. Colocar cucharadas de masa en bandejas para hornear sin engrasar.\n7. Hornear de 9 a 11 minutos.', imageUrl: 'https://picsum.photos/seed/cookies/400/300' },
];

const App: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load recipes from localStorage on initial render
    useEffect(() => {
        try {
            const storedRecipes = localStorage.getItem('gaba-recipes');
            if (storedRecipes) {
                setRecipes(JSON.parse(storedRecipes));
            } else {
                setRecipes(INITIAL_RECIPES);
            }
        } catch (error) {
            console.error("Failed to load recipes from localStorage", error);
            setRecipes(INITIAL_RECIPES);
        }
    }, []);

    // Save recipes to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('gaba-recipes', JSON.stringify(recipes));
        } catch (error) {
            console.error("Failed to save recipes to localStorage", error);
        }
    }, [recipes]);

    const handleSelectRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsModalOpen(true);
    };

    const handleOpenNewRecipeModal = () => {
        setSelectedRecipe(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRecipe(null);
    };

    const handleSaveRecipe = (recipeData: Omit<Recipe, 'id'> & { id?: string }) => {
        if (recipeData.id) {
            // Editing existing recipe
            setRecipes(recipes.map(r => r.id === recipeData.id ? { ...r, ...recipeData } as Recipe : r));
        } else {
            // Adding new recipe
            const newRecipe: Recipe = {
                ...recipeData,
                id: Date.now().toString(),
                imageUrl: recipeData.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/300`
            };
            setRecipes([newRecipe, ...recipes]);
        }
    };
    
    const handleDeleteRecipe = (id: string) => {
        setRecipes(recipes.filter(r => r.id !== id));
    }

    const handleSaveFromChatbot = useCallback((suggestion: RecipeSuggestion) => {
        const newRecipe: Recipe = {
            id: Date.now().toString(),
            title: suggestion.title,
            ingredients: suggestion.ingredients.join('\n'),
            steps: suggestion.steps.join('\n'),
            imageUrl: `https://picsum.photos/seed/${suggestion.title.replace(/\s+/g, '-')}/400/300`,
        };
        setRecipes(prev => [newRecipe, ...prev]);
    }, []);

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <header className="py-8 text-center">
                <div className="inline-flex items-center gap-4">
                    <HeartIcon className="w-10 h-10 text-brand-pink"/>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-text">Recetario de Gaba</h1>
                    <HeartIcon className="w-10 h-10 text-brand-pink"/>
                </div>
                <p className="mt-2 text-lg text-brand-text/80">Bienvenida a tu lugar especial para creaciones culinarias 💖</p>
            </header>

            <main className="container mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {recipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => handleSelectRecipe(recipe)} />
                    ))}
                </div>
            </main>
            
            <footer className="text-center p-6 text-brand-text/70">
                Hecho con ❤️ por Santi
            </footer>

            <RecipeModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRecipe}
                onDelete={handleDeleteRecipe}
                recipe={selectedRecipe}
            />

            <div className="fixed bottom-5 left-5 z-40">
                <button 
                    onClick={handleOpenNewRecipeModal} 
                    className="p-4 bg-brand-pink text-white rounded-full shadow-lg transform hover:scale-110 transition-transform"
                >
                    <PlusIcon className="w-8 h-8"/>
                </button>
            </div>
            
            <Chatbot onSaveRecipe={handleSaveFromChatbot} />
        </div>
    );
};

export default App;