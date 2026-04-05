import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import CompanyDetail from './pages/CompanyDetail'

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/company/:id" element={<CompanyDetail />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </HelmetProvider>
  )
}
