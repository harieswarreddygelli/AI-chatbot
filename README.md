<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,50:203A43,100:2C5364&height=220&section=header&text=LOCAL%20AI&fontSize=48&fontColor=FFFFFF&fontAlignY=38&desc=Your%20Private%20AI%20Assistant%20%7C%20Powered%20Locally&descAlignY=58&descSize=17&animation=fadeIn" width="100%"/>
</p>

<p align="center">

  <strong>A private AI chatbot built for intelligent conversations, memory, personalities and web intelligence.</strong>

</p>

<p align="center">

<img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white"/>
<img src="https://img.shields.io/badge/Ollama-FFFFFF?style=flat-square&logo=ollama&logoColor=black"/>
<img src="https://img.shields.io/badge/Local%20AI-2C5364?style=flat-square"/>

</p>

---

# Local AI

**Local AI** is a locally running AI chatbot designed to provide a ChatGPT-like experience while keeping conversations and AI inference under your control.

The project combines local LLMs with useful features such as persistent memory, streaming responses, multiple personalities, and web search.

> Run AI locally. Keep your conversations yours.

---

## Features

| Feature | Description |
|---|---|
| 💬 Streaming Responses | Real-time AI response generation |
| 🧠 Long-Term Memory | Remember important information across conversations |
| 🗂️ Chat History | Manage and revisit previous conversations |
| 🎭 AI Personalities | Switch between specialized AI assistants |
| 🌐 Web Intelligence | Search the web for current information |
| 🔗 Source References | Display sources for web-based responses |
| 🖥️ Local Execution | AI runs locally using Ollama |
| ⚙️ Memory Center | View, edit and manage stored memories |

---

# Personalities

The chatbot includes multiple personalities designed for different use cases.

### 🌐 General

Your everyday AI assistant for conversations and general questions.

### 🧭 Tour Guide

Helps explore places and provides travel-related information.

### 💻 Coder

Focused on programming, debugging and technical explanations.

### 🎓 Mentor

Designed to explain concepts and guide learning.

---

<!--# Interface

## Clean Chat Experience

<p align="center">
  <img src="https://github.com/harieswarreddygelli/AI-chatbot/blob/main/assets/Screenshots/Main-interface.png" width="90%" alt="Local AI Interface"/>
</p>

---

## Intelligent Learning Assistant

<p align="center">
  <img src="assets/chatbot-mentor.png" width="90%" alt="Mentor Personality"/>
</p>

---

## Programming Assistance

<p align="center">
  <img src="assets/chatbot-coder.png" width="90%" alt="Coder Personality"/>
</p>

-->

# Architecture

```text
User
  │
  ▼
Frontend
HTML • CSS • JavaScript
  │
  ▼
Flask Backend
  │
  ├── Conversation Management
  ├── Memory Management
  ├── Personality System
  └── Web Search
  │
  ▼
Ollama
  │
  ▼
Gemma 3
