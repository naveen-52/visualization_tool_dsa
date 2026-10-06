import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AboutPage } from './pages/AboutPage';
import { GraphColoringPage } from './pages/GraphColoringPage';
import { MSTPage } from './pages/MSTPage';
import { HuffmanPage } from './pages/HuffmanPage';
import { AppPage } from './types';

export const App: React.FC = () => {
  // Sync state with URL hash
  const getInitialPage = (): AppPage => {
    const hash = window.location.hash.replace('#', '') as AppPage;
    const validPages: AppPage[] = ['landing', 'dashboard', 'about', 'graph-coloring', 'mst', 'huffman'];
    return validPages.includes(hash) ? hash : 'landing';
  };

  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage());

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as AppPage;
      const validPages: AppPage[] = ['landing', 'dashboard', 'about', 'graph-coloring', 'mst', 'huffman'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'graph-coloring':
        return <GraphColoringPage />;
      case 'mst':
        return <MSTPage />;
      case 'huffman':
        return <HuffmanPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderCurrentPage()}
    </AppLayout>
  );
};

export default App;
