// Declara el objeto global que será inyectado por vite.config.ts
declare const importMetaEnv: Record<string, string>;

import { createClient } from '@supabase/supabase-js';
import { Recipe } from '../types';

// Lee las variables desde el objeto global personalizado.
const supabaseUrl = importMetaEnv.VITE_SUPABASE_URL;
const supabaseKey = importMetaEnv.VITE_SUPABASE_KEY;


if (!supabaseUrl || !supabaseKey) {
    throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_KEY must be provided in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'recipe-images';

export const getRecipes = async (): Promise<Recipe[]> => {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching recipes:", error);
        throw error;
    }
    return data || [];
};

export const uploadImage = async (file: File, recipeId?: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${recipeId || Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    // Add a timestamp to the URL to prevent caching issues when re-uploading the same file name.
    return `${data.publicUrl}?t=${new Date().getTime()}`;
};

type RecipeData = Omit<Recipe, 'id' | 'created_at'>;

export const addRecipe = async (recipe: RecipeData): Promise<Recipe> => {
    const { data, error } = await supabase
        .from('recipes')
        .insert([recipe])
        .select()
        .single();
    
    if (error) {
        console.error("Error adding recipe:", error);
        throw error;
    }
    return data;
}

export const updateRecipe = async (id: string, recipe: Partial<RecipeData>): Promise<Recipe> => {
    const { data, error } = await supabase
        .from('recipes')
        .update(recipe)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating recipe:", error);
        throw error;
    }
    return data;
}

export const deleteRecipe = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting recipe:", error);
        throw error;
    }
}