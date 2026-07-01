import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AddPage from './pages/AddPage'
import TablePage from './pages/TablePage'
import CalendarPage from './pages/CalendarPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/table" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table"
          element={
            <ProtectedRoute>
              <TablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
