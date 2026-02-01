import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { LoadingIndicator } from './components/ui/LoadingIndicator';
import { EmailProvider } from './contexts/EmailContext';
import { AuthProvider } from './contexts/AuthContext';
import { LeadProvider } from './contexts/LeadContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ExitIntentPopup from './components/lead-capture/ExitIntentPopup';
import { AIChatbot } from './components/chat';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const EmailInbox = lazy(() => import('./pages/EmailInbox'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.5
};

function App() {
  return (
    <AuthProvider>
      <EmailProvider>
        <LeadProvider>
          <div className="min-h-screen bg-dark-950">
            {/* Skip Navigation Link */}
            <a
              href="#main-content"
              className="skip-link"
            >
              Skip to main content
            </a>

            <Header />
            <main id="main-content" className="flex-grow" role="main">
              <Suspense fallback={<LoadingIndicator fullScreen text="Loading page..." />}>
              <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  <motion.div
                    key="home"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <HomePage />
                  </motion.div>
                } />
                <Route path="/products" element={
                  <motion.div
                    key="products"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ProductsPage />
                  </motion.div>
                } />
                <Route path="/services" element={
                  <motion.div
                    key="services"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ServicesPage />
                  </motion.div>
                } />
                <Route path="/about" element={
                  <motion.div
                    key="about"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <AboutPage />
                  </motion.div>
                } />
                <Route path="/contact" element={
                  <motion.div
                    key="contact"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ContactPage />
                  </motion.div>
                } />
                <Route path="/terms" element={
                  <motion.div
                    key="terms"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <TermsPage />
                  </motion.div>
                } />
                <Route path="/privacy" element={
                  <motion.div
                    key="privacy"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <PrivacyPage />
                  </motion.div>
                } />
                <Route path="/careers" element={
                  <motion.div
                    key="careers"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <CareersPage />
                  </motion.div>
                } />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/email" element={
                  <ProtectedRoute>
                    <motion.div
                      key="email"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={pageVariants}
                      transition={pageTransition}
                      className="min-h-screen bg-dark-950"
                    >
                      <EmailInbox />
                    </motion.div>
                  </ProtectedRoute>
                } />
                <Route path="/email/:folder" element={
                  <ProtectedRoute>
                    <motion.div
                      key="email-folder"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={pageVariants}
                      transition={pageTransition}
                      className="min-h-screen bg-dark-950"
                    >
                      <EmailInbox />
                    </motion.div>
                  </ProtectedRoute>
                } />
                <Route path="*" element={
                  <motion.div
                    key="notfound"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <NotFoundPage />
                  </motion.div>
                } />
              </Routes>
            </AnimatePresence>
            </Suspense>
          </main>
          <Footer />
          <ExitIntentPopup />
          <AIChatbot />
        </div>
        </LeadProvider>
      </EmailProvider>
    </AuthProvider>
  );
}

export default App;
