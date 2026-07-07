import base64
import os
from fastapi import APIRouter
from pydantic import BaseModel

from agent import ask_ai, run_agent
from email.message import EmailMessage

from google.oauth2 import credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify"  
]

router = APIRouter(prefix="/gmail", tags=["gmail"])


# -----------------------------
# MODELS
# -----------------------------
class SendEmailRequest(BaseModel):
    prompt: str
    destination: str
    subject: str


class AgentChatRequest(BaseModel):
    message: str
    conversation_history: list = []

# -----------------------------
# AUTH
# -----------------------------
def get_credentials():
    creds = None

    if os.path.exists("token.json"):
        creds = credentials.Credentials.from_authorized_user_file(
            "token.json", SCOPES
        )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json",
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return creds


# -----------------------------
# SEND EMAIL (FIXED)
# -----------------------------
@router.post("/emails/send")
def send_email(request: SendEmailRequest):
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)

    message = EmailMessage()

    message.set_content(
    ask_ai(f"""
        Write a professional email.

        Subject: {request.subject}
        Context: {request.prompt}

        Only return the email body, without placeholder text like "[Your Name]" or "[Company Name]".
        """)
    )

    message["To"] = request.destination
    message["From"] = "me"
    message["Subject"] = request.subject

    encoded_message = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    result = service.users().messages().send(
        userId="me",
        body={"raw": encoded_message}
    ).execute()

    print(f"Email sent: {result['id']}")

    return {"message_id": result["id"]}


# -----------------------------
# HELPER: GET EMAIL BODY
# -----------------------------

# def get_body(payload):
#     """Saca el texto del email recursivamente"""
#     if payload.get("body", {}).get("data"):
#         return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="ignore")
    
#     # si tiene partes (multipart), busca el texto plano
#     for part in payload.get("parts", []):
#         if part["mimeType"] == "text/plain":
#             return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
    
#     return ""

def get_html_body(payload):
    """Busca recursivamente la parte text/html en el payload de Gmail."""
    if payload.get("mimeType") == "text/html" and "data" in payload.get("body", {}):
        return decode_body(payload["body"]["data"])

    for part in payload.get("parts", []):
        result = get_html_body(part)
        if result:
            return result

    # fallback a plain text si no hay html
    if payload.get("mimeType") == "text/plain" and "data" in payload.get("body", {}):
        return decode_body(payload["body"]["data"])

    return None

def decode_body(data):
    decoded_bytes = base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))
    return decoded_bytes.decode("utf-8", errors="replace")


# -----------------------------
# READ EMAILS (FIXED)
# -----------------------------
@router.get("/emails")
def read_email(filter: str = "inbox"):
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)

    query_map = {
        "inbox": "in:inbox",
        "sent": "in:sent",
        "drafts": "in:drafts",
        "spam": "in:spam"
    }

    q = query_map.get(filter, "in:inbox")

    results = service.users().messages().list(
        userId="me",
        q=q,
        maxResults=20
    ).execute()

    messages = results.get("messages", [])

    emails = []

    for message in messages:
        msg = service.users().messages().get(
            userId="me",
            id=message["id"]
        ).execute()

        headers = msg["payload"]["headers"]

        sender = next(
            (h["value"] for h in headers if h["name"] == "From"),
            "Unknown"
        )

        subject = next(
            (h["value"] for h in headers if h["name"] == "Subject"),
            "(No subject)"
        )

        destination = next(
            (h["value"] for h in headers if h["name"] == "To"),
            ""
        )

        emails.append({
            "id": msg["id"],
            "sender": sender,
            "subject": subject,
            "destination": destination,
            "preview": msg.get("snippet", ""),
            "content": get_html_body(msg["payload"]),
            "time": msg.get("internalDate", ""),
            "tag": "inbox"
        })

    return emails


# -----------------------------
# SUMMARIZE (FIXED)
# -----------------------------
@router.post("/emails/summarize")
def summarize_emails(emails: list):
    summaries = []

    for email in emails:
        summary = ask_ai(
            "Summarize this email in under 100 characters: "
            + str(email)
        )
        summaries.append(summary)

    return summaries

# -----------------------------
# ARCHIVE (FIXED)
# -----------------------------

def archive_email_internal(email_id: str):
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)
    
    service.users().messages().modify(
        userId="me",
        id=email_id,
        body={"removeLabelIds": ["INBOX"]}
    ).execute()
    
    return {"archived": email_id}

# -----------------------------
# email counter
# -----------------------------

# gmail_router.py
@router.get("/emails/counts")
def get_email_counts():
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)

    labels = ["INBOX", "SENT", "DRAFT", "TRASH"]
    counts = {}

    for label in labels:
        result = service.users().messages().list(
            userId="me",
            labelIds=[label],
            maxResults=50
        ).execute()
        counts[label.lower()] = result.get("resultSizeEstimate", 0)

    return counts

@router.post("/agent/chat")
def chat_with_agent(request: AgentChatRequest):
    tool_executor = {
        "read_emails": lambda max_results=20: read_email(),  # tu función existente
        "send_email": lambda to, subject, body: send_email(
            SendEmailRequest(prompt=body, destination=to, subject=subject)
        ),
        "archive_email": lambda email_id: archive_email_internal(email_id),
        "add_todo": lambda task, priority, deadline=None: {
            "task": task, "priority": priority, "deadline": deadline
        },
    }

    response, updated_history = run_agent(
        request.message,
        tool_executor,
        request.conversation_history
    )

    return {"response": response, "history": updated_history}