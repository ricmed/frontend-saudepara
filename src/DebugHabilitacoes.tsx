// Debug component to check API calls
import { useHabilitacoes } from "@/features/apps/hooks/useHabilitacao";

const DebugHabilitacoes = () => {
  const { data, isLoading, error } = useHabilitacoes(1, 10, '');
  
  console.log('Debug Habilitações:', { data, isLoading, error });
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px' }}>
      <h2>Debug Habilitações</h2>
      <p>Loading: {isLoading ? 'true' : 'false'}</p>
      <p>Error: {error ? JSON.stringify(error) : 'none'}</p>
      <p>Data: {data ? JSON.stringify(data, null, 2) : 'none'}</p>
    </div>
  );
};

export default DebugHabilitacoes;
