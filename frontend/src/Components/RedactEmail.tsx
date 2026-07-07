import { useState } from "react";
import "../css/RedactEmail.css";

function RedactEmail() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [subject, setSubject] = useState("");
  const [destination, setDestination] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(false);

  // RESET TOTAL (Gmail style)
  const reset = () => {
    setSubject("");
    setDestination("");
    setBody("");
  };

  // CLOSE (IMPORTANTE: reset de todo estado visual)
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    reset();
  };

  // SEND EMAIL
  const sendEmail = async () => {
    if (!destination || !subject || !body) return;

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:8000/gmail/emails/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject,
            destination,
            body,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Email sent:", data);

      handleClose(); // Gmail behavior: enviar = cerrar

    } catch (err) {
      console.error("Error sending email:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* COMPOSE BUTTON (solo si está cerrado) */}
      {!isOpen && (
        <button
          className="compose-button"
          onClick={() => setIsOpen(true)}
        >
          Compose
        </button>
      )}

      {/* COMPOSE WINDOW */}
      {isOpen && (
        <div className="redact-email-card">
          
          {/* HEADER */}
          <div className="redact-email-header">
            <span>New Message</span>

            <div className="redact-email-controls">
              
              {/* MINIMIZE */}
              <button
                className="minimize-button"
                onClick={() => setIsMinimized((p) => !p)}
              >
                {isMinimized ? "▢" : "—"}
              </button>

              {/* CLOSE */}
              <button
                className="close-button"
                onClick={handleClose}
              >
                ✕
              </button>
            </div>
          </div>

          {/* BODY (hidden when minimized) */}
          {!isMinimized && (
            <>
              <div className="redact-email-body">
                
                <input
                  className="redact-email-input"
                  type="text"
                  placeholder="To"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />

                <input
                  className="redact-email-input"
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <textarea
                  className="redact-email-textarea"
                  placeholder="Write your message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              {/* FOOTER */}
              <div className="redact-email-footer">
                <button
                  className="send-button"
                  onClick={sendEmail}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default RedactEmail;