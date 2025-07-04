const { parseSearchQuery, calculateRelevanceScore } = require('../src/shared/utils/search-parser.ts');

console.log('=== Debug OR Query ===');
const query = parseSearchQuery('москва OR спб');
console.log('Parsed query:', JSON.stringify(query, null, 2));

const text1 = 'Путешествие в Москву';
const text2 = 'Путешествие в СПб';
const text3 = 'Путешествие в Казань';

console.log('Text1:', text1);
console.log('Text1 toLowerCase:', text1.toLowerCase());

console.log('Score1:', calculateRelevanceScore(text1, query, 1.0));
console.log('Score2:', calculateRelevanceScore(text2, query, 1.0));
console.log('Score3:', calculateRelevanceScore(text3, query, 1.0));

// Test individual includes
console.log('Does "путешествие в москву" include "москва"?', text1.toLowerCase().includes('москва'));
console.log('Does "путешествие в спб" include "спб"?', text2.toLowerCase().includes('спб'));
EOF < /dev/null