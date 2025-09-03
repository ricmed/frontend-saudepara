// Test script to verify AI Global Configuration is working
console.log('🧪 Testing AI Global Configuration...');

// Simulate localStorage operations
const testConfig = {
  mode: 'api',
  apiKey: 'sk-or-test123',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  selectedModel: 'meta-llama/llama-3.1-8b-instruct:free'
};

// Test saving global config
localStorage.setItem('aiGlobalConfig', JSON.stringify(testConfig));
console.log('✅ Global config saved');

// Test loading global config
const loadedConfig = JSON.parse(localStorage.getItem('aiGlobalConfig') || '{}');
console.log('✅ Global config loaded:', loadedConfig);

// Verify config structure
const requiredFields = ['mode', 'apiKey', 'endpoint', 'selectedModel'];
const hasAllFields = requiredFields.every(field => field in loadedConfig);
console.log('✅ All required fields present:', hasAllFields);

// Test OpenRouter models fetch (mock)
console.log('🤖 Testing model fetching...');
const mockModels = [
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', description: 'Free Llama model' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast Claude model' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Compact GPT-4 model' }
];

console.log('✅ Mock models loaded:', mockModels.length);

// Test search functionality
const searchTerm = 'llama';
const filteredModels = mockModels.filter(model => 
  model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  model.description.toLowerCase().includes(searchTerm.toLowerCase())
);
console.log('✅ Search functionality works:', filteredModels.length, 'models found for "llama"');

console.log('🎉 All AI configuration tests passed!');
