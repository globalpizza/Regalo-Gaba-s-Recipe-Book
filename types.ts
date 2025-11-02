export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  imageUrl: string;
  created_at: string;
}

export interface RecipeSuggestion {
  title: string;
  ingredients: string[];
  steps: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  recipe?: RecipeSuggestion;
  state?: 'awaiting_feedback' | null;
}