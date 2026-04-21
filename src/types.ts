export type ContentBlock = 
  | { 
      id: string; 
      type: 'text'; 
      value: string; 
      fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
      listStyle?: 'none' | 'bullet' | 'dash';
      isBold?: boolean;
      isItalic?: boolean;
      isUnderline?: boolean;
    }
  | { id: string; type: 'image'; value: string; caption?: string };

export interface NewsArticle {
  id: string;
  title: string;
  subtitle: string;
  headerImage: string | null;
  content: ContentBlock[];
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'published';
  author?: string;
}

export interface TopItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  image: string | null;
}

export interface TopList {
  id: string;
  type: 'anime' | 'manga';
  items: TopItem[];
  updatedAt: number;
}

export interface Recommendation {
  id: number;
  title: string;
  anime_name: string;
  trailer_url: string;
  image_url: string;
  created_at: string;
}

export interface CommissionInquiry {
  id: string;
  full_name: string;
  email: string;
  social_platform: string;
  social_username: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
}
