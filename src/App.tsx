import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

const Home = lazy(() => import('./pages/Home'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/company/:id" element={<CompanyDetail />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  )
}
