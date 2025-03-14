// src/features/apps/components/shared/Layout/PageLayout.tsx
interface PageLayoutProps {
    children: React.ReactNode;
  }
  
  export const PageLayout = ({ children }: PageLayoutProps) => {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  };