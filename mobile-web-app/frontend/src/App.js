import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';  // Make sure this path is correct
// import other pages if you have them

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* Add other routes here if needed */}
      </Routes>
    </Router>
  );
}

export default App;