import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Signup from './Signup'
import Login from './Login'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import Customers from './pages/Customers'
import Team from './pages/Team'
import Billing from './pages/Billing'

function AppRoutes() {
  const { loading, user } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/invoices" element={user ? <Invoices /> : <Navigate to="/login" />} />
      <Route path="/customers" element={user ? <Customers /> : <Navigate to="/login" />} />
      <Route path="/team" element={user ? <Team /> : <Navigate to="/login" />} />
      <Route path="/billing" element={user ? <Billing /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
