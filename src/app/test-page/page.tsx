export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>🧪 Тестовая страница - Тест Hydration</h1>
      <p>Если вы видите этот текст без ошибок в консоли, то hydration работает корректно.</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>
        <h2>Статус: Загружено</h2>
      </div>
    </div>
  );
} 