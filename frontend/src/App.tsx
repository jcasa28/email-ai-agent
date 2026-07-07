import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AgentChat from './Components/AgentChat'
import EmailContainer from './Components/EmailContainer'
import LeftSidebar from './Components/LeftSidebar'
import RedactEmail from './Components/RedactEmail'

function App() {
  return (
    <div className="app-shell">
      <main className="workspace-grid">
        <BrowserRouter>
          <LeftSidebar />

          <Routes>
            <Route path="/inbox" element={<EmailContainer filter="inbox" />} />
            <Route path="/sent" element={<EmailContainer filter="sent" />} />
            <Route path="/drafts" element={<EmailContainer filter="drafts" />} />
            <Route path="/trash" element={<EmailContainer filter="trash" />} />
            <Route path="/" element={<EmailContainer filter="inbox" />} />
          </Routes>

          <RedactEmail />
          <AgentChat />
        </BrowserRouter>
      </main>
    </div>
  )
}

export default App
