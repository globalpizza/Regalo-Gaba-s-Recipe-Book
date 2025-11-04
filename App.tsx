import React, { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeSuggestion } from './types';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';
import Chatbot from './components/Chatbot';
import { PlusIcon, HeartIcon } from './components/Icons';
import { getRecipes, addRecipe, updateRecipe, deleteRecipe, uploadImage, deleteImage } from './services/supabaseService';
import { generateRecipeImage } from './services/geminiService';

// Helper function to convert base64 to a File object
const base64ToFile = async (base64String: string, fileName: string): Promise<File> => {
    const res = await fetch(`data:image/png;base64,${base64String}`);
    const blob = await res.blob();
    return new File([blob], fileName, { type: 'image/png' });
};

const App: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSavingChatRecipe, setIsSavingChatRecipe] = useState(false);

    const fetchRecipes = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

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
            // --- UPDATE EXISTING RECIPE ---
            if (recipeData.id) {
                let finalImageUrl = recipeData.image_url;

                if (imageFile) {
                    // If there's an old image, delete it first.
                    if (recipeData.image_url) {
                        await deleteImage(recipeData.image_url);
                    }
                    // Upload the new image.
                    finalImageUrl = await uploadImage(imageFile);
                }
                
                const payload = {
                    title: recipeData.title,
                    ingredients: recipeData.ingredients,
                    steps: recipeData.steps,
                    image_url: finalImageUrl,
                };

                const updated = await updateRecipe(recipeData.id, payload);
                setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
            
            // --- CREATE NEW RECIPE (ROBUST 2-STEP PROCESS) ---
            } else {
                // Step 1: Create the recipe without the image to get a stable ID.
                const initialPayload = {
                    title: recipeData.title,
                    ingredients: recipeData.ingredients,
                    steps: recipeData.steps,
                    image_url: null,
                };
                let newRecipe = await addRecipe(initialPayload);

                // Step 2: If there's an image, upload it and update the recipe.
                if (imageFile) {
                    const imageUrl = await uploadImage(imageFile);
                    // Step 3: Update the recipe with the new image URL.
                    newRecipe = await updateRecipe(newRecipe.id, { image_url: imageUrl });
                }
                
                // Refetch to get the latest list including the new one
                fetchRecipes();
            }
        } catch (error) {
            console.error("Failed to save recipe:", error);
            const message = (error as Error).message;
            if (message.includes('security policy')) {
                 alert(`Error al guardar: La base de datos denegó el permiso. Revisa las políticas de seguridad (RLS) en Supabase.`);
            } else {
                 alert(`Error al guardar la receta: ${message}`);
            }
        }
    };
    
    const handleDeleteRecipe = async (id: string) => {
        try {
            const recipeToDelete = recipes.find(r => r.id === id);
            
            await deleteRecipe(id);
            
            if (recipeToDelete && recipeToDelete.image_url) {
                await deleteImage(recipeToDelete.image_url);
            }

            setRecipes(recipes.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete recipe:", error);
            const message = (error as Error).message;
             if (message.includes('security policy')) {
                 alert(`Error al eliminar: La base de datos denegó el permiso. Revisa las políticas de seguridad (RLS) en Supabase.`);
            } else {
                 alert(`Error al eliminar la receta: ${message}`);
            }
        }
    }

    const handleSaveFromChatbot = useCallback(async (suggestion: RecipeSuggestion) => {
        setIsSavingChatRecipe(true);
        let finalImageUrl: string | null = null;
        let imageFileToUpload: File | null = null;
        
        try {
            alert("¡Genial! Creando una imagen para tu receta. Esto puede tardar unos segundos...");

            const imageBase64 = await generateRecipeImage(suggestion.title);
            const imageName = `${suggestion.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
            imageFileToUpload = await base64ToFile(imageBase64, imageName);
            alert("¡Imagen generada con éxito!");
            
        } catch (imageError) {
            console.error("Failed to generate image with AI, falling back to image search:", imageError);
            alert(`No se pudo generar una imagen. Buscando una alternativa en internet...`);
            try {
                const searchQuery = encodeURIComponent(`${suggestion.title} food dish`);
                const response = await fetch(`https://source.unsplash.com/400x300/?${searchQuery}`);
                if (response.url) {
                    finalImageUrl = response.url;
                }
            } catch (fallbackError) {
                console.error("Unsplash fallback failed:", fallbackError);
            }
        }

        try {
            const initialPayload = {
                title: suggestion.title,
                ingredients: suggestion.ingredients.join('\n'),
                steps: suggestion.steps.join('\n'),
                image_url: finalImageUrl, // Use Unsplash URL if available, otherwise null
            };
            let newRecipe = await addRecipe(initialPayload);

            if (imageFileToUpload) {
                const uploadedImageUrl = await uploadImage(imageFileToUpload);
                newRecipe = await updateRecipe(newRecipe.id, { image_url: uploadedImageUrl });
            }
            
            fetchRecipes(); // Refetch to get the latest list
            alert("¡Receta guardada en tu recetario!");

        } catch (saveError) {
            console.error("Failed to save recipe from chatbot:", saveError);
             const message = (saveError as Error).message;
            if (message.includes('security policy')) {
                alert(`Error al guardar: La base de datos denegó el permiso. Revisa las políticas de seguridad (RLS) en Supabase.`);
            } else {
                alert(`Error al guardar la receta del chatbot: ${message}`);
            }
        } finally {
            setIsSavingChatRecipe(false);
        }
    }, [fetchRecipes]);

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
                 {isSavingChatRecipe && (
                    <div className="fixed top-4 right-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50 animate-pulse">
                        Guardando nueva receta del asistente...
                    </div>
                 )}
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