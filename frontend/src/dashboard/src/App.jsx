// src/App.jsx - React Router Setup
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Import all 22 view components
import Dashboard from './views/Dashboard';
import LiveFarmView from './views/LiveFarmView';
import OngoingProjects from './views/OngoingProjects';
import CompletedProjects from './views/CompletedProjects';
import ProjectManager from './views/ProjectManager';
import DownloadReports from './views/DownloadReports';
import Payments from './views/Payments';
import BatchManagement from './views/BatchManagement';
import BirdsHealth from './views/BirdsHealth';
import FeedAndWater from './views/FeedAndWater';
import Environment from './views/Environment';
import Performance from './views/Performance';
import AIInsights from './views/AIInsights';
import FinancialOverview from './views/FinancialOverview';
import ProfitForecast from './views/ProfitForecast';
import BatchwiseRevenue from './views/BatchwiseRevenue';
import HistoricalReports from './views/HistoricalReports';
import CostIntelligence from './views/CostIntelligence';
import CoursesOverview from './views/CoursesOverview';
import LearningInProgress from './views/LearningInProgress';
import SOPsChecklists from './views/SOPsChecklists';
import MyCertificates from './views/MyCertificates';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          {/* MAIN Section */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-farm-view" element={<LiveFarmView />} />
          <Route path="/ongoing-projects" element={<OngoingProjects />} />
          <Route path="/completed-projects" element={<CompletedProjects />} />
          <Route path="/project-manager" element={<ProjectManager />} />
          <Route path="/download-reports" element={<DownloadReports />} />
          <Route path="/payments" element={<Payments />} />

          {/* FARM OPERATIONS Section */}
          <Route path="/batch-management" element={<BatchManagement />} />
          <Route path="/birds-health" element={<BirdsHealth />} />
          <Route path="/feed-and-water" element={<FeedAndWater />} />
          <Route path="/environment" element={<Environment />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/ai-insights" element={<AIInsights />} />

          {/* FINANCIAL INTELLIGENCE Section */}
          <Route path="/financial-overview" element={<FinancialOverview />} />
          <Route path="/profit-forecast" element={<ProfitForecast />} />
          <Route path="/batchwise-revenue" element={<BatchwiseRevenue />} />
          <Route path="/historical-reports" element={<HistoricalReports />} />
          <Route path="/cost-intelligence" element={<CostIntelligence />} />

          {/* KNOWLEDGE CENTER Section */}
          <Route path="/courses" element={<CoursesOverview />} />
          <Route path="/learning" element={<LearningInProgress />} />
          <Route path="/sops" element={<SOPsChecklists />} />
          <Route path="/certificates" element={<MyCertificates />} />

          {/* Default route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}