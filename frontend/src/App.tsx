import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Chat = lazy(() => import('@/pages/Chat'))
const Account = lazy(() => import('@/pages/Account'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const SharedConversation = lazy(() => import('@/pages/SharedConversation'))

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 text-[#c9a84c] animate-spin" />
        <span className="text-[11px] font-medium text-white/50 tracking-wider uppercase">Cargando...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <>{children}</>
  return <Navigate to={user?.isAdmin ? '/portal-interno' : '/dashboard'} replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return user?.isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function InfoRedirect() {
  useEffect(() => {
    window.location.replace('/info.html')
  }, [])
  return null
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/info" element={<InfoRedirect />} />
          <Route path="/landing" element={<InfoRedirect />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:agentId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal-interno"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/shared/:token" element={<SharedConversation />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}
