import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>
        🧪 Test Page - Platform is Working
      </h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#28a745', marginBottom: '10px' }}>✅ React App Status</h2>
        <p>✅ React is rendering correctly</p>
        <p>✅ TypeScript compilation is working</p>
        <p>✅ Vite dev server is running</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff', marginBottom: '10px' }}>🔧 Quick Tests</h3>
        <p>• Current URL: {window.location.href}</p>
        <p>• Timestamp: {new Date().toISOString()}</p>
        <p>• User Agent: {navigator.userAgent.substring(0, 50)}...</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#6f42c1', marginBottom: '10px' }}>🔗 Navigation Test</h3>
        <a 
          href="/" 
          style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            padding: '10px 20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            display: 'inline-block',
            margin: '5px'
          }}
          aria-label="Navigate to homepage"
        >
          Go to Home (/)
        </a>
        
        <a 
          href="/dashboard" 
          style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            padding: '10px 20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            display: 'inline-block',
            margin: '5px'
          }}
          aria-label="Navigate to dashboard"
        >
          Go to Dashboard (/dashboard)
        </a>
      </div>

      <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <p style={{ margin: '0', color: '#155724' }}>
          <strong>Success!</strong> If you can see this page, React and the development server are working correctly.
          The blank page issue is likely in specific components or authentication logic.
        </p>
      </div>
    </div>
  );
};

export default TestPage;