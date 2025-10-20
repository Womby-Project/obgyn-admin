export type StepContextType = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
};


export interface Article {
  id: string;
  title: string;
  description?: string;
  image?: string;
  body?: string | null;
  author?: string | null;
  publishedDate?: string;
  source?: string;
  fetchedDate?: string;
  views?: number;
}
