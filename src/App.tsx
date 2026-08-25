import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { Shell } from './Shell'
import { AppDetailPage } from './pages/AppDetail'
import { AppsPage } from './pages/Apps'
import { AutomationsPage } from './pages/Automations'
import { ChatPage } from './pages/Chat'
import { HomePage } from './pages/Home'
import { SessionsPage } from './pages/Sessions'
import { SettingsPage } from './pages/Settings'
import { SkillsPage } from './pages/Skills'
import { TaskConfirmPage } from './pages/TaskConfirm'
import { TasksPage } from './pages/Tasks'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:sessionId" element={<ChatPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:taskId" element={<TaskConfirmPage />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/apps/:appId" element={<AppDetailPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/inbox" element={<Navigate to="/apps" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
