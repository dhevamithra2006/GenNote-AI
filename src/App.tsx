import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageModeProvider } from './context/LanguageModeContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotebookWorkspace } from './pages/NotebookWorkspace';
import { SearchModal } from './components/SearchModal';
import { SearchResult } from './types';
import { api } from './services/api';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [activeNotebookId, setActiveNotebookId] = useState<string>('demo-nb-os');
  const [activeNotebookTitle, setActiveNotebookTitle] = useState<string>('Operating Systems & Distributed Architecture');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch title whenever activeNotebookId changes
  useEffect(() => {
    if (activeNotebookId) {
      api.getNotebook(activeNotebookId)
        .then(res => {
          if (res.notebook) setActiveNotebookTitle(res.notebook.title);
        })
        .catch(() => {});
    }
  }, [activeNotebookId]);

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
    setCurrentRoute('notebook');
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    if (result.targetTab) {
      setCurrentRoute('notebook');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] dark:bg-neutral-950 font-sans antialiased text-neutral-900 dark:text-neutral-100">
      <Navbar
        notebookTitle={currentRoute === 'notebook' ? activeNotebookTitle : undefined}
        notebookId={currentRoute === 'notebook' ? activeNotebookId : undefined}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={(route) => setCurrentRoute(route)}
      />

      <main className="flex-1 flex flex-col">
        {currentRoute === 'landing' && (
          <LandingPage
            onStart={() => setCurrentRoute(user ? 'dashboard' : 'login')}
            onLogin={() => setCurrentRoute('login')}
          />
        )}

        {(currentRoute === 'login' || currentRoute === 'signup') && (
          <AuthPage
            initialMode={currentRoute === 'signup' ? 'signup' : 'login'}
            onSuccess={() => setCurrentRoute('dashboard')}
          />
        )}

        {currentRoute === 'dashboard' && (
          <DashboardPage onSelectNotebook={handleSelectNotebook} />
        )}

        {currentRoute === 'notebook' && (
          <NotebookWorkspace
            notebookId={activeNotebookId}
            onNavigateDashboard={() => setCurrentRoute('dashboard')}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}
      </main>

      {/* Global Search Modal */}
      {activeNotebookId && (
        <SearchModal
          notebookId={activeNotebookId}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={handleSelectSearchResult}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageModeProvider>
          <MainApp />
        </LanguageModeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
