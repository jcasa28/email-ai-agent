import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/LeftSidebar.css";

function LeftSidebar() {

  interface Counts {
  inbox: number;
  sent: number;
  draft: number;
  trash: number;
}


  const [counts, setCounts] = useState<Counts>({ inbox: 0, sent: 0, draft: 0, trash: 0 });
  const location = useLocation();

  useEffect(() => {
    fetch("http://localhost:8000/gmail/emails/counts")
      .then(res => res.json())
      .then(data => setCounts(data));
  }, []);

  const isActive = (path: string) => location.pathname === path;




  return (
    <aside className="sidebar-card">
      <div className="sidebar-header">
        <p>Workspace</p>
        <strong>Mailbox</strong>
      </div>

      <nav className="sidebar-nav" aria-label="Mailbox folders">
        <Link to="/inbox" className={`sidebar-link ${isActive("/inbox") ? "active" : ""}`}>
          <span>Inbox</span>
          <strong>{counts.inbox}</strong>
        </Link >
        <Link to="/sent" className={`sidebar-link ${isActive("/sent") ? "active" : ""}`}>
          <span>Sent</span>
          <strong>{counts.sent}</strong>
        </Link>
        <Link to="/drafts" className={`sidebar-link ${isActive("/drafts") ? "active" : ""}`}>
          <span>Drafts</span>
          <strong>{counts.draft}</strong>
        </Link>
        <Link to="/trash" className={`sidebar-link ${isActive("/trash") ? "active" : ""}`}>
          <span>Trash</span>
          <strong>{counts.trash}</strong>
        </Link>
        {/* <Link to="/calendar" className={`sidebar-link ${isActive("/calendar") ? "active" : ""}`}>
          <span>Calendar</span>
          <strong>Today</strong>
        </Link> */}
      </nav>
    </aside>
  )
}

export default LeftSidebar;