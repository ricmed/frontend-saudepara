// src/features/apps/components/shared/Form/ButtonGroup.tsx
interface ButtonGroupProps {
    children: React.ReactNode;
  }
  
  export const ButtonGroup = ({ children }: ButtonGroupProps) => {
    return (
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    );
  };