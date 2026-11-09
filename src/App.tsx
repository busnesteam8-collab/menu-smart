import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { RestaurantAdminDashboard } from './pages/RestaurantAdminDashboard';
import { PublicMenuView } from './pages/PublicMenuView';
import { RegisterRestaurantPage } from './pages/RegisterRestaurantPage';
import { store } from './services/store';
import { Restaurant } from './types';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { firestoreConfigService } from './services/firestoreConfigService';
import { firestoreRestaurantService } from './services/firestoreRestaurantService';

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(store.getAllRestaurants());
  const [currentView, setCurrentView] = useState<
    'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register'
  >('landing');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    restaurants[0]?.id || 'rest-1'
  );
  const [tableParam, setTableParam] = useState<string | undefined>(undefined);

  // Initialize Cloud Firestore real-time sync for Plans, Settings, and Restaurants
  useEffect(() => {
    const unsubConfig = firestoreConfigService.init();
    const unsubRestaurants = firestoreRestaurantService.init();
    return () => {
      unsubConfig();
      unsubRestaurants();
    };
  }, []);

  // Subscribe to reactive store changes
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setRestaurants(store.getAllRestaurants());
    });
    return unsub;
  }, []);

  // Parse URL query parameters if present (e.g. ?rest=rest-1&table=5)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const restParam = params.get('rest');
      const table = params.get('table');

      if (restParam) {
        const found = store.getRestaurantById(restParam) || store.getRestaurantBySlug(restParam);
        if (found) {
          setSelectedRestaurantId(found.id);
          if (table) {
            setTableParam(table);
          }
          setCurrentView('public_menu');
        }
      }
    } catch (e) {
      console.error('Error parsing URL params', e);
    }
  }, []);

  const handleNavigate = (
    view: 'landing' | 'super_admin' | 'restaurant_admin' | 'public_menu' | 'register'
  ) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-amber-500 selection:text-white" dir="rtl">
        {/* Universal Multi-Tenant Navbar */}
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          selectedRestaurantId={selectedRestaurantId}
          onSelectRestaurantId={handleSelectRestaurant}
          restaurants={restaurants}
        />

        {/* Main Page Routing */}
        <main className="flex-1">
          {currentView === 'landing' && (
            <LandingPage
              onNavigate={handleNavigate}
              onSelectRestaurantId={handleSelectRestaurant}
              restaurants={restaurants}
            />
          )}

          {currentView === 'register' && (
            <RegisterRestaurantPage
              onNavigate={handleNavigate}
              onSelectRestaurantId={handleSelectRestaurant}
            />
          )}

          {currentView === 'super_admin' && (
            <ProtectedRoute
              requireAuth={true}
              requireSuperAdmin={true}
              onNavigate={handleNavigate}
            >
              <SuperAdminDashboard
                restaurants={restaurants}
                onSelectRestaurantId={handleSelectRestaurant}
                onNavigate={handleNavigate}
              />
            </ProtectedRoute>
          )}

          {currentView === 'restaurant_admin' && (
            <ProtectedRoute
              requireAuth={true}
              requireRestaurantOwner={true}
              restaurantId={selectedRestaurantId}
              onNavigate={handleNavigate}
              onSelectRestaurantId={handleSelectRestaurant}
            >
              <RestaurantAdminDashboard
                restaurantId={selectedRestaurantId}
                onNavigate={handleNavigate}
                onSelectRestaurantId={handleSelectRestaurant}
              />
            </ProtectedRoute>
          )}

          {currentView === 'public_menu' && (
            <PublicMenuView
              restaurantId={selectedRestaurantId}
              tableParam={tableParam}
              onNavigate={handleNavigate}
              onSelectRestaurantId={handleSelectRestaurant}
              restaurants={restaurants}
            />
          )}
        </main>

        {/* SaaS Footer */}
        {(currentView === 'landing' || currentView === 'register') && (
          <Footer onNavigate={handleNavigate} />
        )}
      </div>
    </AuthProvider>
  );
}
