import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { CloseIcon } from './Icons';

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: Omit<Recipe, 'id'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    recipe: Recipe | null;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, onSave, onDelete, recipe }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [steps, setSteps] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (recipe) {
            setTitle(recipe.title);
            setIngredients(recipe.ingredients);
            setSteps(recipe.steps);
            setImageUrl(recipe.imageUrl);
            setIsEditing(false); // Default to view mode
        } else {
            // New recipe mode
            setTitle('');
            setIngredients('');
            setSteps('');
            setImageUrl('');
            setIsEditing(true);
        }
    }, [recipe]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim()) {
            alert("¡Por favor, añade un título!");
            return;
        }
        onSave({ id: recipe?.id, title, ingredients, steps, imageUrl });
        onClose();
    };
    
    const handleDelete = () => {
        if (recipe && window.confirm(`¿Estás segura de que quieres eliminar "${recipe.title}"?`)) {
            onDelete(recipe.id);
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-brand-cream rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-transform duration-300 transform scale-95 animate-scale-in">
                <div className="p-6 border-b border-brand-orange flex justify-between items-center">
                    {isEditing ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título de la Receta"
                            className="text-2xl font-serif font-bold text-brand-text bg-transparent border-b-2 border-brand-pink focus:outline-none w-full"
                        />
                    ) : (
                        <h2 className="text-3xl font-serif font-bold text-brand-text">{title}</h2>
                    )}
                    <button onClick={onClose} className="text-brand-text hover:text-brand-pink-dark transition-colors">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="mb-6">
                         <img src={imageUrl || 'https://picsum.photos/800/400'} alt={title} className="w-full h-64 object-cover rounded-lg shadow-md" />
                         {isEditing && (
                             <input type="text" placeholder="URL de la Imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-2 w-full p-2 border border-brand-orange rounded-md bg-white focus:ring-2 focus:ring-brand-pink focus:outline-none"/>
                         )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-2xl font-serif text-brand-text mb-2">Ingredientes</h3>
                            {isEditing ? (
                                <textarea
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    placeholder="Escribe cada ingrediente en una nueva línea..."
                                    className="w-full h-64 p-3 border border-brand-orange rounded-md bg-white focus:ring-2 focus:ring-brand-pink focus:outline-none"
                                />
                            ) : (
                                <p className="whitespace-pre-wrap text-brand-text prose">{ingredients}</p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif text-brand-text mb-2">Pasos</h3>
                            {isEditing ? (
                                <textarea
                                    value={steps}
                                    onChange={(e) => setSteps(e.target.value)}
                                    placeholder="Escribe cada paso en una nueva línea..."
                                    className="w-full h-64 p-3 border border-brand-orange rounded-md bg-white focus:ring-2 focus:ring-brand-pink focus:outline-none"
                                />
                            ) : (
                                <p className="whitespace-pre-wrap text-brand-text prose">{steps}</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-white/50 border-t border-brand-orange flex justify-end items-center gap-4">
                    {isEditing ? (
                        <button onClick={handleSave} className="px-6 py-2 bg-brand-pink-dark text-white font-bold rounded-full hover:bg-opacity-80 transition-all shadow-md">
                            Guardar Receta
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-brand-pink text-white font-bold rounded-full hover:bg-brand-pink-dark transition-all shadow-md">
                            Editar
                        </button>
                    )}
                    {recipe && (
                        <button onClick={handleDelete} className="px-4 py-2 text-red-500 hover:text-white hover:bg-red-500 font-semibold rounded-full transition-colors">
                           Eliminar
                        </button>
                    )}
                </div>
            </div>
            <style>{`.animate-scale-in { animation: scaleIn 0.3s ease-out forwards; } @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
    );
};

export default RecipeModal;