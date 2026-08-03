
// Pass collapsed to <Sidebar> and <main> for margin adjustment// src/components/layout/Layout.jsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import '../styles/layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  return (
    <div className="db-layout">
      {/* Top Navigation */}
      <TopNav
        onSidebarToggle={() => setCollapsed(!collapsed)}
        showUserMenu={showUserMenu}
        onUserMenuToggle={() => setShowUserMenu(!showUserMenu)}
      />

      <div className="db-body">
        {/* Sidebar Navigation */}
        <Sidebar
          collapsed={collapsed}
          currentPath={location.pathname}
        />

        {/* Main Content Area */}
        <main className={`db-main ${collapsed ? 'collapsed' : ''}`}>
          <div className="db-panel">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}