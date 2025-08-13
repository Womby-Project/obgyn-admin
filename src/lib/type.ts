// types.ts
export type StepContextType = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  totalSteps: number;
  formData: any; // you can replace 'any' with a proper type matching obgyn_users
  setFormData: React.Dispatch<React.SetStateAction<any>>;
};
