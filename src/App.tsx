import { Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import BottomTabBar from './components/BottomTabBar'
import ErrorFallback from './components/ErrorFallback'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import RecordsLayout from './components/RecordsLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AddPage from './pages/AddPage'
import EditPage from './pages/EditPage'
import TablePage from './pages/TablePage'
import CalendarPage from './pages/CalendarPage'
import DashboardPage from './pages/DashboardPage'
import AdminFeedbackPage from './pages/AdminFeedbackPage'
import NaverCallbackPage from './pages/NaverCallbackPage'
import MyPage from './pages/MyPage'

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/naver/callback" element={<NaverCallbackPage />} />
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
            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute>
                  <AdminFeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </ErrorBoundary>
      <Footer />
      <BottomTabBar />
    </div>
  )
}

export default App
