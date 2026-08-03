// src/components/layout/TopNav.jsx
import React from 'react';

export default function TopNav({ onSidebarToggle, showUserMenu, onUserMenuToggle }) {
  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('fs_token');
      await fetch(`${window.location.origin}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Sign out error:', err);
    }
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    window.location.href = '/pages/sign-in.html';
  };

  const user = JSON.parse(localStorage.getItem('fs_user')) || {};

  return (
    <header className="db-topnav">
      <div className="db-topnav-left">
        <button
          className="db-icon-btn"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <a href="/" className="db-brand" aria-label="Farmsence home">
          <img src="/assets/logos/Farmsence_Black.svg" alt="Farmsence" />
        </a>
      </div>

      <div className="db-topnav-right">
        <button className="db-icon-btn" title="Search">
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
        <button className="db-icon-btn" title="Layout">
          <i className="fa-solid fa-table-cells"></i>
        </button>
        <button className="db-icon-btn db-bell-btn" title="Notifications">
          <i className="fa-regular fa-bell"></i>
          <span className="db-bell-badge">3</span>
        </button>

        {/* User Avatar & Menu */}
        <div className="db-user-pill" onClick={onUserMenuToggle}>
          <div className="db-avatar-circle">
            <i className="fa-solid fa-user"></i>
          </div>
          <div className="db-user-info">
            <span className="db-user-name">{user.name || 'John Doe'}</span>
            <span className="db-user-plan">Basic Plan</span>
          </div>
          <i className="fa-solid fa-chevron-down db-user-chevron"></i>
        </div>

        {/* Avatar Dropdown */}
        {showUserMenu && (
          <div className="db-avatar-dropdown">
            <div className="db-avatar-dropdown-email">{user.email || 'user@farmsence.ai'}</div>
            <button
              className="db-avatar-dropdown-signout"
              onClick={handleSignOut}
            >
              <i className="fa-solid fa-right-from-bracket"></i> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
