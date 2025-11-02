import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeSuggestion } from './types';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';
import Chatbot from './components/Chatbot';
import { PlusIcon, HeartIcon } from './components/Icons';
import { getRecipes, addRecipe, updateRecipe, deleteRecipe, uploadImage } from './services/supabaseService';

const App: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const data = await getRecipes();
                setRecipes(data);
                setError(null);
            } catch (err) {
                setError("No se pudieron cargar las recetas. Revisa la configuración de Supabase.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecipes();
    }, []);

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

    const handleSaveRecipe = async (
        recipeData: Omit<Recipe, 'id' | 'created_at' | 'image_url'> & { id?: string; image_url: string | null },
        imageFile: File | null
    ) => {
        try {
            let finalImageUrl = recipeData.image_url;

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile, recipeData.id);
            }

            const payload = {
                title: recipeData.title,
                ingredients: recipeData.ingredients,
                steps: recipeData.steps,
                image_url: finalImageUrl,
            };

            if (recipeData.id) {
                const updated = await updateRecipe(recipeData.id, payload);
                setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
            } else {
                const newRecipe = await addRecipe(payload);
                setRecipes([newRecipe, ...recipes]);
            }
        } catch (error) {
            console.error("Failed to save recipe:", error);
            alert("Error al guardar la receta.");
        }
    };
    
    const handleDeleteRecipe = async (id: string) => {
        try {
            await deleteRecipe(id);
            setRecipes(recipes.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete recipe:", error);
            alert("Error al eliminar la receta.");
        }
    }

    const handleSaveFromChatbot = useCallback(async (suggestion: RecipeSuggestion) => {
        try {
            const newRecipeData = {
                title: suggestion.title,
                ingredients: suggestion.ingredients.join('\n'),
                steps: suggestion.steps.join('\n'),
                image_url: `https://picsum.photos/seed/${suggestion.title.replace(/\s+/g, '-')}/400/300`,
            };
            const newRecipe = await addRecipe(newRecipeData);
            setRecipes(prev => [newRecipe, ...prev]);
        } catch (error) {
            console.error("Failed to save recipe from chatbot:", error);
            alert("Error al guardar la receta del chatbot.");
        }
    }, []);

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <header className="py-8 text-center">
                <div className="inline-flex items-center gap-4">
                    <HeartIcon className="w-10 h-10 text-brand-pink"/>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-text">Gaba's Recipe Book</h1>
                    <HeartIcon className="w-10 h-10 text-brand-pink"/>
                </div>
                <p className="mt-2 text-lg text-brand-text/80">Bienvenida a tu lugar especial para creaciones culinarias 💖</p>
            </header>

            <main className="container mx-auto px-4 pb-24">
                 {isLoading ? (
                    <div className="text-center py-10">
                        <p className="text-lg animate-pulse">Cargando tus recetas...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500 font-semibold bg-red-100 p-4 rounded-lg">
                        <p>{error}</p>
                    </div>
                ) : recipes.length === 0 ? (
                     <div className="text-center py-20">
                        <h2 className="text-2xl font-serif text-brand-text">¡Tu recetario está vacío!</h2>
                        <p className="mt-2 text-brand-text/80">Añade tu primera receta usando el botón `+`.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {recipes.map(recipe => (
                            <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => handleSelectRecipe(recipe)} />
                        ))}
                    </div>
                )}
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