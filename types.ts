export interface CourseModule {
  title: string;
  content: string; // Markdown supported
  imageKeyword: string;
  keyPoints: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
}

export interface Course {
  title: string;
  introduction: string;
  modules: CourseModule[];
  quiz: QuizQuestion[];
}

export type AppState = 
  | 'INITIAL'       // Step 0: User inputs topic
  | 'LOADING_PILLARS'
  | 'SELECT_PILLAR' // Step 1: User selects a pillar
  | 'LOADING_VARIATIONS'
  | 'SELECT_VARIATION' // Step 2: User selects a variation
  | 'LOADING_COURSE'
  | 'VIEW_COURSE';   // Step 3: View full course

export interface HistoryItem {
    topic: string;
    selectedPillar?: string;
    pillars?: string[];
    variations?: string[];
}

declare global {
  interface Window {
    JSZip: any;
  }
}