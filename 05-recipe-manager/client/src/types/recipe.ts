export type Category = { id: number; name: string; slug: string };

export type Recipe = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_public: boolean;
  is_favorite?: boolean;
  author_name?: string;
  categories?: Category[];
  ingredients?: Array<{ id: number; quantity: string | null; unit: string | null; name: string }>;
  steps?: Array<{ id: number; step_number: number; instruction: string; image_url: string | null }>;
};

export type User = { id: number; username: string; email: string; display_name?: string };
