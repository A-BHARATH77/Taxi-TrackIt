import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="light" storageKey="taxi-trackit-theme">
    <App />
    <Toaster position="top-right" />
  </ThemeProvider>
)
