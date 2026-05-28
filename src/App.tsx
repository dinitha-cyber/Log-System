import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { MainLayout } from './components/layout/MainLayout'

// User Pages
import { Dashboard as UserDashboard } from './pages/user/Dashboard'
import { NewLog } from './pages/user/NewLog'
import { EditLog } from './pages/user/EditLog'

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard'
import { UsersPage } from './pages/admin/Users'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* User Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/new" element={<NewLog />} />
          <Route path="/dashboard/edit/:id" element={<EditLog />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<MainLayout requireAdmin />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
