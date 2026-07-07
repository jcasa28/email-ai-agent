import '../css/AgentChat.css'
import { useState } from 'react'

function AgentChat() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

const sendMessage = async () => {
  try {
    setLoading(true)

    const res = await fetch('http://localhost:8000/gmail/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_history: history,
      }),
    })

    const data = await res.json()
    console.log('Agent response:', data)

    setMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: data.response },
    ])

    setHistory(data.history)

    setMessage('')
    setSubject('')
    setDestination('')
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  return (
    <aside className="chat-card">
      <div className="chat-header">
        <div>
          <p className="panel-label">Assistant</p>
          <h2>Email assistant</h2>
        </div>
        <span className="chat-status">Ready</span>
      </div>

<div className="chat-thread">

  {messages.length === 0 ? (

    <p className="chat-note">

      Use the assistant panel to draft replies, summarize messages, or create events.

    </p>

  ) : (

    messages.map((msg, index) => (

      <div key={index} className={`chat-message ${msg.role}`}>

        {msg.content}

      </div>

    ))

  )}

</div>

      {/*
      <div className="chat-actions">
        <button type="button">Summarize</button>
        <button type="button">Draft reply</button>
        <button type="button">Create event</button>
      </div>
      */}

      <div className="chat-input">
        <label>
          <span>Recipient</span>
          <input
            type="email"
            placeholder="to@example.com"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </label>

        <label>
          <span>Subject</span>
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>

        <label>
          <span>Message</span>
          <textarea
            rows={4}
            placeholder="Write a brief instruction or summary for the assistant."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      </div>

      <button
        className="send-button"
        type="button"
        onClick={sendMessage}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </aside>
  )
}

export default AgentChat