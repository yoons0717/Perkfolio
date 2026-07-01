import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/add" element={<AddPage />} />
        <Route path="/table" element={<TablePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </>
  )
}

export default App
