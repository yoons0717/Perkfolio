import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import RecordsLayout from './components/RecordsLayout'
import LoginPage from './pages/LoginPage'
import AddPage from './pages/AddPage'
import EditPage from './pages/EditPage'
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
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <RecordsLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/table" element={<TablePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>
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
