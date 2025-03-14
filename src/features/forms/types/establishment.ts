export interface FormFieldProps {
    label: string;
    type?: string;
    required?: boolean;
    options?: string[];
    name?: string;
    [key: string]: any;
  }
  
  export interface DualSelectFieldProps {
    label: string;
    sourceItems: string[];
    targetItems: string[];
    onChange?: (selectedItems: string[]) => void;
  }