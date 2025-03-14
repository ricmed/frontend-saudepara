// src/features/apps/components/shared/Form/FormContainer.tsx
interface FormContainerProps {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
  }
  
  export const FormContainer = ({ children, onSubmit }: FormContainerProps) => {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            {children}
          </div>
        </form>
      </main>
    );
  };