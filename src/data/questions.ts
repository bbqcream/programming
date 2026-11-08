import questionBank from "../../programming_gineungsa_qbank.json";

export type QuizTable = {
  name: string;
  columns: string[];
  rows: (string | number | null)[][];
};

export type QuizQuestion = {
  id: string;
  category: string;
  subcategory?: string;
  title: string;
  difficulty: number;
  day: number;
  type: string;
  question: string;
  code?: string;
  code_language?: string;
  tables?: QuizTable[];
  answer: string;
  model_answer?: string;
  explanation?: string;
};

const bank = questionBank as unknown as { questions: QuizQuestion[] };

export const questions = bank.questions;
