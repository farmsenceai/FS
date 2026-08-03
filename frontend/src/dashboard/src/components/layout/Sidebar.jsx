// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV } from './navConfig';
import { getIcon } from '../../utils/iconUtils';

export default function Sidebar({ collapsed, currentPath }) {
  return (
    <aside className={`db-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="db-sidebar-nav">
        {NAV.map((section, sectionIdx) => (
          <div key={sectionIdx} className="db-sidebar-group">
            <span className="db-sidebar-label">{section.section}</span>
            {section.items.map((item, itemIdx) => (
              <Link
                key={itemIdx}
                to={item.path}
                className={`db-sidebar-link ${currentPath === item.path ? 'active' : ''}`}
              >
                {getIcon(item.icon)}
                <span className="db-link-text">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}

        {/* Help Section */}
        <div className="db-sidebar-help">
          <p className="db-help-title">Need More Help?</p>
          <p className="db-help-desc">Connect with your project manager for any queries. (Mon - Sat: 10:00 AM to 5:00PM)</p>
          <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="db-whatsapp-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="db-wa-icon">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M11.998 2C6.477 2 2 6.477 2 12c0 1.89.502 3.662 1.379 5.193L2 22l4.938-1.353A10.02 10.02 0 0 0 12 22c5.523 0 10-4.477 10-10S17.521 2 11.998 2zm0 18.333a8.322 8.322 0 0 1-4.248-1.163l-.305-.181-3.139.86.844-3.084-.2-.317A8.33 8.33 0 0 1 3.667 12c0-4.595 3.738-8.333 8.333-8.333 4.595 0 8.333 3.738 8.333 8.333 0 4.596-3.738 8.333-8.335 8.333z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </nav>
    </aside>
  );
}