import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Navbar from './components/ui/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Prediction from './pages/Prediction'
import History from './pages/History'
import Admin from './pages/Admin'
import Doctor from './pages/Doctor'
import DoctorPatients from './pages/DoctorPatients'
import DoctorPatientDetail from './pages/DoctorPatientDetail'
import Profile from './pages/Profile'
import { useAuth } from './context/AuthContext'

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <div className={`min-h-screen ${user ? 'app-shell' : 'public-shell'}`}>
      <Navbar />
      <main className={user ? 'app-main' : 'public-main'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
            <Route path="/dashboard" element={
              <ProtectedRoute requireRole={['patient']}><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/predict" element={
              <ProtectedRoute requireRole={['doctor']}><PageWrapper><Prediction /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute requireRole={['patient']}><PageWrapper><History /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/doctor" element={
              <ProtectedRoute requireRole={['doctor']}><PageWrapper><Doctor /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
              <ProtectedRoute requireRole={['doctor']}><PageWrapper><DoctorPatients /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/doctor/patients/:patientId/assess" element={
              <ProtectedRoute requireRole={['doctor']}><PageWrapper><Prediction /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/doctor/patients/:patientId" element={
              <ProtectedRoute requireRole={['doctor']}><PageWrapper><DoctorPatientDetail /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireRole={['admin']}><PageWrapper><Admin /></PageWrapper></ProtectedRoute>
            } />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
