import json

from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Callable

load_dotenv()

SYSTEM_PROMPT = """
You are an intelligent email assistant with access to Gmail and Google Calendar.

## Your capabilities (tools)
- read_emails: Fetch unread emails from inbox
- summarize_emails: Summarize and prioritize a batch of emails
- draft_reply: Draft a reply to a specific email
- send_email: Send an email (ALWAYS ask user confirmation first)
- archive_email: Archive an email (ALWAYS ask user confirmation first)
- create_calendar_event: Create a calendar event from email context
- add_todo: Add an item to the to-do list

## Rules
- NEVER send, archive, or create events without explicit user approval
- When processing emails, always classify as: ACTION_REQUIRED, FYI, WAITING_ON, NEWSLETTER, SPAM
- Assign priority: HIGH, MEDIUM, LOW
- Keep to-do items concise: [Action verb] + [context] + [deadline if known]
- Batch low-priority suggested actions and present them together

## Output format for email batches
For each email:
📧 [Sender] — [Subject]
- Summary: ...
- Priority: HIGH / MEDIUM / LOW  
- Category: ACTION_REQUIRED / FYI / ...
- Suggested action: ...
"""


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_emails",
            "description": "Fetch the latest unread emails from Gmail inbox",
            "parameters": {
                "type": "object",
                "properties": {
                    "max_results": {"type": "integer", "default": 20}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "draft_reply",
            "description": "Draft a reply to an email. Returns draft for user approval before sending.",
            "parameters": {
                "type": "object",
                "properties": {
                    "email_id": {"type": "string"},
                    "context": {"type": "string"}
                },
                "required": ["email_id", "context"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email. Only call after user explicitly approves.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "archive_email",
            "description": "Archive an email. Only call after user explicitly approves.",
            "parameters": {
                "type": "object",
                "properties": {
                    "email_id": {"type": "string"}
                },
                "required": ["email_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_calendar_event",
            "description": "Create a Google Calendar event from email context.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["title", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_todo",
            "description": "Add an actionable item to the to-do list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {"type": "string"},
                    "deadline": {"type": "string"},
                    "priority": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"]}
                },
                "required": ["task", "priority"]
            }
        }
    }
]


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_ai(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def run_agent(user_message: str, tool_executor: dict[str, Callable], conversation_history: list = []):
    """Loop principal del agente con tools."""
    messages = conversation_history + [{"role": "user", "content": user_message}]

    while True:
        response = client.chat.completions.create(
            model="gpt-4o",
            tools=TOOLS,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages
        )

        msg = response.choices[0].message

        # Sin tool calls → terminó, devuelve respuesta final
        if not msg.tool_calls:
            return msg.content, messages

        messages.append(msg)

        for tool_call in msg.tool_calls:
            tool_name = tool_call.function.name
            tool_input = json.loads(tool_call.function.arguments)

            print(f"🔧 Agent calling: {tool_name} with {tool_input}")

            result = tool_executor.get(
                tool_name,
                lambda **_: {"error": f"Tool '{tool_name}' not implemented"}
            )(**tool_input)

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
