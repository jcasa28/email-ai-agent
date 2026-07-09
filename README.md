# Email Agent

An AI-powered email client that connects to Gmail and lets an agent read, draft, and manage messages on your behalf. Built with a React/TypeScript frontend and a FastAPI/Python backend, using the Gmail API for mail access and OpenAI for the agentic layer.

## Features

- **Outlook-style UI** — familiar three-pane layout (folder list, message list, reading pane) for a low-friction experience.
- **Resizable sidebar** — adjustable folder/navigation panel to fit different workflows and screen sizes.
- **Compose window** — dedicated compose UI for drafting, replying, and forwarding messages.
- **Agentic tool-calling** — the AI agent can call tools (e.g., search inbox, draft reply, label/archive, fetch thread context) rather than just generating text, enabling multi-step email workflows.
- **Gmail integration** — reads and writes mail through the official Gmail API (OAuth-based auth, not IMAP scraping).
- **Calendar view** — built-in calendar where the agent can create events directly (e.g., from meeting requests or dates mentioned in emails), without switching apps.
- **OpenAI-powered reasoning** — natural language requests ("find emails from Citi HR last week and draft a reply" or "add this interview to my calendar") are interpreted and executed via tool calls.

## Tech Stack

---

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| Frontend           | React, TypeScript                        |
| Backend            | Python, FastAPI                          |
| Mail Access        | Gmail API                                |
| Calendar Access    | Google Calendar API                      |
| AI / Agent         | OpenAI API (function/tool calling)       |
| Auth               | OAuth 2.0 (Google)                       |
| ********\_******** | ****************\_\_\_\_**************** |

## Architecture Overview

```
┌─────────────────┐        ┌───────────────────┐        ┌───────────────┐
│  React Frontend │  HTTP  │  FastAPI Backend  │  API   │   Gmail API   │
│  (TS, compose,  │◄──────►│  (agent orchestr.,│◄──────►│  (read/send/  │
│  sidebar, panes,│        │   tool execution) │        │   labels)     │
│  calendar view) │        │                   │        └───────────────┘
└─────────────────┘        │                   │        ┌───────────────┐
                           │                   │◄──────►│ Calendar API  │
                           │                   │        │ (create/edit  │
                           │                   │        │  events)      │
                           └─────────┬─────────┘        └───────────────┘
                                     │ API
                                     ▼
                             ┌───────────────┐
                             │   OpenAI API  │
                             │ (tool-calling)│
                             └───────────────┘
```

## Getting Started

### Prerequisites

- Node.js (for the frontend)
- Python 3.10+ (for the backend)
- A Google Cloud project with the Gmail API enabled and OAuth credentials
- An OpenAI API key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Create a `.env` file with:

```
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

> Note: the OAuth scopes should include both Gmail (`gmail.readonly` / `gmail.send` / `gmail.modify`) and Calendar (`calendar.events`) so the agent can read/send mail and create calendar events.

Run the server:

```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Sign in with your Google account (OAuth) to grant Gmail access.
2. Use the inbox view to browse messages across the resizable sidebar and message list.
3. Open the compose window to draft, reply, or forward.
4. Ask the agent to perform tasks in natural language (e.g., "summarize unread emails from today," "draft a reply to the last email from Jennifer"), and it will call the appropriate tools to complete them.

## Roadmap / Ideas

- [ ] Thread-level summarization
- [ ] Smart labeling / auto-triage
- [ ] Scheduled send
- [ ] Multi-account support

## License

Personal project — license TBD.
