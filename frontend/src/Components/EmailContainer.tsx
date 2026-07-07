import { useEffect, useState } from 'react'
import '../css/EmailContainer.css'
import DOMPurify from 'dompurify'

interface Email {
  id: string
  sender: string
  subject: string
  preview: string
  content: string
  time: string
  tag: string
  destination: string
}

interface EmailContainerProps {
  filter?: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'
}

function EmailContainer({ filter }: EmailContainerProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

  useEffect(() => {
    fetch(`http://localhost:8000/gmail/emails?filter=${filter}`)
      .then((res) => res.json())
      .then((data) => {
        setEmails(data)
        setSelectedEmail(data?.[0] ?? null)
      })
  }, [filter])

  const title =
    filter === 'sent'
      ? 'Sent'
      : filter === 'drafts'
      ? 'Drafts'
      : filter === 'trash'
      ? 'Trash'
      : 'Inbox'

  const tagClass = (tag?: string) => `email-tag ${tag?.toLowerCase().replace(/\s+/g, '-') ?? ''}`

  return (
    <section className="email-container">
      <div className="email-container-header">
        <div>
          <h1>{title}</h1>
          <p className="email-subtitle">{emails.length} messages</p>
        </div>
      </div>

      <div className="email-layout">
        <div className="email-list" aria-label="Email list">
          {emails.length === 0 ? (
            <div className="email-empty">No messages in this folder.</div>
          ) : (
            emails.map((email) => (
              <button
                key={email.id}
                type="button"
                className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <div className="email-row">
                  <div>
                    <strong>{email.sender}</strong>
                    {email.destination && <span className="email-destination">to {email.destination}</span>}
                  </div>
                  <span className="email-time">{email.time}</span>
                </div>

                <p className="email-subject">{email.subject}</p>
                <p className="email-preview">{email.preview}</p>
                <span className={tagClass(email.tag)}>{email.tag}</span>
              </button>
            ))
          )}
        </div>

        <div className="email-content-wrapper" aria-label="Selected email content">
          <div className="email-content">
            {selectedEmail ? (
              <>
                <div className="email-meta">
                  <div>
                    <h2>{selectedEmail.subject}</h2>
                    <p className="email-sender">
                      {selectedEmail.sender}
                      {selectedEmail.destination ? ` → ${selectedEmail.destination}` : ''}
                    </p>
                  </div>
                  <span className="email-time">{selectedEmail.time}</span>
                </div>

                <span className={tagClass(selectedEmail.tag)}>{selectedEmail.tag}</span>

                <div
                  className="email-body-html"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedEmail.content, {
                      ADD_ATTR: ['target'],
                    }),
                  }}
                />
              </>
            ) : (
              <div className="email-empty email-empty-preview">Select a message to preview.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmailContainer
