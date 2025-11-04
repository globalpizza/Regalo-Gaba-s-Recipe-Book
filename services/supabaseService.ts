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

export const deleteImage = async (imageUrl: string): Promise<void> => {
    if (!imageUrl || !imageUrl.includes(BUCKET_NAME)) {
        return;
    }
    
    try {
        const filePath = imageUrl.split(`${BUCKET_NAME}/`)[1].split('?')[0];
        if (!filePath) {
            console.warn("Could not extract file path from image URL for deletion:", imageUrl);
            return;
        }

        const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

        if (error) {
            // It's often safe to just log this error and not throw,
            // as it might fail if the file doesn't exist, which is fine.
            console.error("Could not delete image, it might not exist:", error.message);
        }
    } catch (e) {
        console.error("Error parsing image URL for deletion:", e);
    }
};

export const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    // Generate a unique file name using a UUID to prevent overwriting issues
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    // No upsert needed as the file name is always unique
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return data.publicUrl;
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