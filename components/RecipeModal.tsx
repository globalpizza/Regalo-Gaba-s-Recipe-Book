import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { CloseIcon, UploadIcon } from './Icons';

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: Omit<Recipe, 'id' | 'created_at'> & { id?: string }, imageFile: File | null) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    recipe: Recipe | null;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, onSave, onDelete, recipe }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [steps, setSteps] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    useEffect(() => {
        if (recipe) {
            setTitle(recipe.title);
            setIngredients(recipe.ingredients);
            setSteps(recipe.steps);
            setImagePreview(recipe.image_url);
            setImageFile(null);
            setIsEditing(false);
        } else {
            setTitle('');
            setIngredients('');
            setSteps('');
            setImagePreview(null);
            setImageFile(null);
            setIsEditing(true);
        }
        setIsConfirmingDelete(false);
        setIsSaving(false);
        setIsDeleting(false);
    }, [recipe, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert("¡Por favor, añade un título!");
            return;
        }
        setIsSaving(true);
        await onSave({ id: recipe?.id, title, ingredients, steps, image_url: recipe?.image_url || '' }, imageFile);
        setIsSaving(false);
        onClose();
    };
    
    const handleDelete = async () => {
        if (recipe) {
            setIsDeleting(true);
            await onDelete(recipe.id);
            setIsDeleting(false);
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
                     <div className="mb-6 relative">
                         <img src={imagePreview || 'https://via.placeholder.com/800x400.png?text=Añade+una+imagen'} alt={title} className="w-full h-64 object-cover rounded-lg shadow-md bg-brand-orange" />
                         {isEditing && (
                            <label htmlFor="image-upload" className="absolute bottom-2 right-2 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-brand-text font-semibold rounded-full shadow-md hover:bg-white cursor-pointer transition-all">
                                <UploadIcon className="w-5 h-5" />
                                <span>{imageFile ? "Cambiar foto" : "Subir foto"}</span>
                                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
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
                                <p className="whitespace-pre-wrap text-brand-text prose">{ingredients || "No hay ingredientes."}</p>
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
                                <p className="whitespace-pre-wrap text-brand-text prose">{steps || "No hay pasos."}</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-white/50 border-t border-brand-orange flex justify-end items-center gap-4">
                    {isConfirmingDelete ? (
                        <div className="w-full flex justify-between items-center">
                             <p className="text-red-600 font-bold">¿Seguro que quieres eliminar esta receta?</p>
                             <div className="flex gap-2">
                                <button onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 font-semibold rounded-full transition-colors">
                                   Cancelar
                                </button>
                                <button onClick={handleDelete} disabled={isDeleting} className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all shadow-md disabled:bg-red-300">
                                   {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                             </div>
                        </div>
                    ) : (
                        <>
                            {isEditing ? (
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-brand-pink-dark text-white font-bold rounded-full hover:bg-opacity-80 transition-all shadow-md disabled:bg-opacity-50">
                                    {isSaving ? 'Guardando...' : 'Guardar Receta'}
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-brand-pink text-white font-bold rounded-full hover:bg-brand-pink-dark transition-all shadow-md">
                                    Editar
                                </button>
                            )}
                            {recipe && !isEditing && (
                                <button onClick={() => setIsConfirmingDelete(true)} className="px-4 py-2 text-red-500 hover:text-white hover:bg-red-500 font-semibold rounded-full transition-colors">
                                   Eliminar
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
            <style>{`.animate-scale-in { animation: scaleIn 0.3s ease-out forwards; } @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
    );
};

export default RecipeModal;