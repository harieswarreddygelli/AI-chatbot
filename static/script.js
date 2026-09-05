// Fixed script.js — Chat Delete
// Uses a POST deletion request, refreshes the chat list, handles the current chat, and reports errors.
// Step 6 Safe — Full script.js
// Built from the last known working streaming script. Adds copy-response and copy-code UI without replacing or modifying the working SSE chat
// implementation.
// =====================================================
// LOCAL AI CHATBOT
// =====================================================
let currentChatId = null;
let currentPersonality =
"general";
const messages =
document.getElementById(
"messages"
);
const input =
document.getElementById(
"message-input"
);
const sendButton =
document.getElementById(
"send-button"
);
// =====================================================
// INITIALIZE
// =====================================================
document.addEventListener(
"DOMContentLoaded",
function () {
console.log(
"■ Local AI frontend loaded."
);
loadChatList();
input.addEventListener(
"keydown",
function (event) {
if (
event.key === "Enter"
&&
!event.shiftKey
) {
event.preventDefault();
sendMessage();
}
}
);
input.addEventListener(
"input",
function () {
input.style.height =
"auto";
input.style.height =
Math.min(
input.scrollHeight,
180
)
+ "px";
}
);
}
);
// =====================================================
// SCROLL
// =====================================================
function scrollToBottom() {
messages.scrollTop =
messages.scrollHeight;
}
// =====================================================
// ADD MESSAGE
// =====================================================
function addMessage(
text,
role
) {
const message =
document.createElement(
"div"
);
message.className =
`message ${role}`;
if (
role === "user"
) {
message.textContent =
text;
}
else {
message.appendChild(
renderMarkdown(text)
);
}
messages.appendChild(
message
);
scrollToBottom();
return message;
}
// =====================================================
// SEND
// =====================================================
// =====================================================
// HTML ESCAPE HELPER
// =====================================================
function escapeHtml(value) {
const div = document.createElement("div");
div.textContent = String(value ?? "");
return div.innerHTML;
}
async function sendMessage() {
const text = input.value.trim();
if (!text) {
return;
}
if (!currentChatId) {
await createNewChat();
}
addMessage(text, "user");
input.value = "";
input.style.height = "auto";
sendButton.disabled = true;
const aiMessage = document.createElement("div");
aiMessage.className = "message bot";
aiMessage.dataset.rawText = "";
aiMessage.innerHTML = `
<span class="thinking">
Thinking<span class="dots"></span>
</span>
`;
messages.appendChild(aiMessage);
scrollToBottom();
try {
const response = await fetch("/chat", {
method: "POST",
headers: {
"Content-Type": "application/json",
"Accept": "text/event-stream"
},
body: JSON.stringify({
message: text,
chat_id: currentChatId
})
});
if (!response.ok) {
let errorText = "";
try {
errorText = await response.text();
}
catch (_) {
errorText = "";
}
throw new Error(
`Server returned ${response.status}` +
(errorText ? `: ${errorText}` : "")
);
}
if (!response.body) {
throw new Error(
"The browser did not receive a streaming response."
);
}
const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";
let receivedFirstToken = false;
function processSSEEvent(eventText) {
const lines = eventText.split(/\r?\n/);
for (const rawLine of lines) {
const line = rawLine.trimEnd();
if (!line.startsWith("data:")) {
continue;
}
const jsonText = line
.slice(5)
.trim();
if (!jsonText) {
continue;
}
let data;
try {
data = JSON.parse(jsonText);
}
catch (parseError) {
console.warn(
"■■ Could not parse SSE data:",
jsonText,
parseError
);
continue;
}
// ---------------------------------------------
// TOKEN
// ---------------------------------------------
if (data.type === "chunk") {
const content =
typeof data.content === "string"
? data.content
: String(data.content ?? "");
if (!receivedFirstToken) {
receivedFirstToken = true;
console.log(
"■ First frontend token received."
);
aiMessage.innerHTML = "";
}
aiMessage.dataset.rawText += content;
aiMessage.innerHTML = "";
try {
aiMessage.appendChild(
renderMarkdown(
aiMessage.dataset.rawText
)
);
}
catch (renderError) {
console.warn(
"Markdown rendering failed; using plain text.",
renderError
);
aiMessage.textContent =
aiMessage.dataset.rawText;
}
scrollToBottom();
return;
}
// ---------------------------------------------
// DONE
// ---------------------------------------------
if (data.type === "done") {
if (data.chat_id) {
currentChatId =
data.chat_id;
localStorage.setItem(
"currentChatId",
currentChatId
);
}
loadChatList();
return;
}
// ---------------------------------------------
// ERROR
// ---------------------------------------------
if (data.type === "error") {
throw new Error(
data.content ||
"The server returned a chat error."
);
}
}
}
// -----------------------------------------------------
// READ STREAM
// -----------------------------------------------------
while (true) {
const result =
await reader.read();
if (result.done) {
break;
}
buffer += decoder.decode(
result.value,
{
stream: true
}
);
// Flask/SSE normally uses \n\n, but accept \r\n\r\n too.
const events =
buffer.split(/\r?\n\r?\n/);
buffer =
events.pop() || "";
for (const event of events) {
if (!event.trim()) {
continue;
}
processSSEEvent(event);
}
}
// Flush any remaining UTF-8 bytes.
buffer += decoder.decode();
// Process a final event even if the stream ended
// without a trailing blank line.
if (buffer.trim()) {
processSSEEvent(buffer);
}
// If the backend finished without sending a token,
// don't leave the UI stuck on "Thinking".
if (!receivedFirstToken) {
throw new Error(
"The server completed the stream without sending a response."
);
}
}
catch (error) {
console.error(
"■ Chat error:",
error
);
aiMessage.innerHTML = `
<div class="chat-error">
■ Unable to get a response.
<br>
<small>
${escapeHtml(
error.message ||
"Unknown error"
)}
</small>
</div>
`;
}
sendButton.disabled = false;
input.focus();
}
// =====================================================
// NEW CHAT
// =====================================================
async function createNewChat() {
try {
const response =
await fetch(
"/new-chat",
{
method:
"POST",
headers: {
"Content-Type":
"application/json"
},
body:
JSON.stringify({
title:
"New Chat",
personality:
currentPersonality
})
}
);
const data =
await response.json();
if (
!data.success
) {
throw new Error(
"Could not create chat."
);
}
currentChatId =
data.filename;
localStorage.setItem(
"currentChatId",
currentChatId
);
messages.innerHTML =
"";
addWelcomeMessage();
loadChatList();
return data;
}
catch (error) {
console.error(
"New chat error:",
error
);
throw error;
}
}
// =====================================================
// WELCOME
// =====================================================
function addWelcomeMessage() {
const message =
document.createElement(
"div"
);
message.className =
"message bot welcome-message";
message.appendChild(
renderMarkdown(
"## Hello ■\n\n" +
"I'm your local AI assistant. " +
"Ask me anything to get started."
)
);
messages.appendChild(
message
);
scrollToBottom();
}
// =====================================================
// LOAD CHAT LIST
// =====================================================
async function loadChatList() {
try {
const response =
await fetch(
"/chats"
);
const chats =
await response.json();
const chatList =
document.getElementById(
"chat-list"
);
chatList.innerHTML =
"";
chats.forEach(
function (chat) {
const item =
document.createElement(
"div"
);
item.className =
"chat-item";
if (
chat.filename
===
currentChatId
) {
item.classList.add(
"active"
);
}
const title =
document.createElement(
"span"
);
title.className =
"chat-title";
title.textContent =
chat.title
||
"New Chat";
const deleteButton =
document.createElement(
"button"
);
deleteButton.className =
"delete-chat";
deleteButton.textContent =
"×";
deleteButton.type =
"button";
deleteButton.setAttribute(
"aria-label",
"Delete " +
(chat.title || "chat")
);
deleteButton.onclick =
async function (event) {
event.preventDefault();
event.stopPropagation();
await deleteChat(
chat.filename
);
};
item.appendChild(
title
);
item.appendChild(
deleteButton
);
item.onclick =
function () {
loadChat(
chat.filename
);
};
chatList.appendChild(
item
);
}
);
// Restore saved chat
if (
!currentChatId
) {
const saved =
localStorage.getItem(
"currentChatId"
);
if (saved) {
const exists =
chats.some(
chat =>
chat.filename
===
saved
);
if (exists) {
loadChat(saved);
}
}
}
}
catch (error) {
console.error(
"Chat list error:",
error
);
}
}
// =====================================================
// LOAD CHAT
// =====================================================
async function loadChat(
filename
) {
try {
const response =
await fetch(
"/load-chat/"
+
encodeURIComponent(
filename
)
);
const data =
await response.json();
if (
!data.success
) {
throw new Error(
"Could not load chat."
);
}
currentChatId =
data.filename;
localStorage.setItem(
"currentChatId",
currentChatId
);
messages.innerHTML =
"";
const chatMessages =
data.messages
||
[];
let visible =
false;
chatMessages.forEach(
function (message) {
if (
message.role
===
"system"
) {
return;
}
addMessage(
message.content,
message.role ===
"user"
? "user"
: "bot"
);
visible =
true;
}
);
if (!visible) {
addWelcomeMessage();
}
updateChatTitle(
data.title
);
// Restore the personality saved with this chat.
if (
data.personality &&
[
"general",
"saffron",
"coder",
"mentor"
].includes(data.personality)
) {
currentPersonality = data.personality;
document.body.dataset.personality = data.personality;
document
.querySelectorAll(".personality-button")
.forEach(button => {
button.classList.toggle(
"active",
button.dataset.personality === data.personality
);
});
applyPersonalityTheme(
data.personality
);
console.log(
"■ Restored chat personality:",
data.personality
);
}
loadChatList();
}
catch (error) {
console.error(
"Load chat error:",
error
);
}
}
// =====================================================
// CHAT TITLE
// =====================================================
function updateChatTitle(
title
) {
const element =
document.getElementById(
"chat-title"
);
if (element) {
element.textContent =
title
||
"Local AI Assistant";
}
}
// =====================================================
// DELETE CHAT
// =====================================================
async function deleteChat(filename) {
if (!filename) {
console.error(
"Delete failed: missing filename."
);
return;
}
const confirmed = window.confirm(
"Delete this chat permanently?"
);
if (!confirmed) {
return;
}
const wasCurrent =
currentChatId === filename;
try {
// Use POST rather than DELETE for maximum
// browser/server compatibility.
const response = await fetch(
"/delete-chat",
{
method: "POST",
headers: {
"Content-Type":
"application/json",
"Accept":
"application/json"
},
body: JSON.stringify({
filename: filename
})
}
);
const text = await response.text();
let data;
try {
data = JSON.parse(text);
} catch (parseError) {
throw new Error(
"Server returned an invalid response."
);
}
if (
!response.ok ||
!data.success
) {
throw new Error(
data.message ||
"Could not delete chat."
);
}
console.log(
"■■ Chat deleted:",
filename
);
if (wasCurrent) {
currentChatId = null;
localStorage.removeItem(
"currentChatId"
);
messages.innerHTML = "";
await createNewChat();
} else {
await loadChatList();
}
} catch (error) {
console.error(
"■ Delete chat error:",
error
);
alert(
"Could not delete the chat.\n\n" +
error.message
);
}
}
// PERSONALITY
// =====================================================
async function changePersonality(personality) {
console.log("■ Selected:", personality);
// ================================================
// UPDATE UI IMMEDIATELY
// ================================================
currentPersonality = personality;
document.body.dataset.personality = personality;
document
.querySelectorAll(".personality-button")
.forEach(button => {
button.classList.toggle(
"active",
button.dataset.personality === personality
);
});
// ================================================
// SEND TO BACKEND
// ================================================
try {
const response = await fetch(
"/personality",
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
personality: personality,
chat_id: currentChatId
})
}
);
const data = await response.json();
console.log(
"■ Backend personality response:",
data
);
// IMPORTANT:
// Don't automatically switch back to General.
// The UI should remain on the personality
// the user selected.
if (!response.ok) {
console.warn(
"Backend did not accept personality:",
personality
);
return;
}
console.log(
"■ Active personality:",
personality,
"| Chat:",
currentChatId
);
}
catch (error) {
console.error(
"Personality request failed:",
error
);
// Keep the selected personality in the UI.
// This makes it obvious if the problem
// is actually in the backend.
}
}
// =====================================================
// =====================================================
// STEP 10 — MEMORY CENTER (CLEAN VERSION)
// =====================================================
function getMemoryModal() {
return document.getElementById("memory-modal");
}
function openMemoryModal() {
const modal = getMemoryModal();
if (!modal) {
console.error("Memory modal element not found.");
return;
}
modal.classList.add("show");
modal.setAttribute("aria-hidden", "false");
document.body.classList.add("memory-open");
loadMemoryData();
}
function closeMemory() {
const modal = getMemoryModal();
if (!modal) {
return;
}
modal.classList.remove("show");
modal.setAttribute("aria-hidden", "true");
document.body.classList.remove("memory-open");
}
async function loadMemory() {
openMemoryModal();
}
async function loadMemoryData() {
const list = document.getElementById("memory-list");
if (list) {
list.innerHTML =
'<div class="empty-memory">Loading memory...</div>';
}
try {
const response = await fetch("/memory", {
method: "GET",
headers: {
"Accept": "application/json"
}
});
if (!response.ok) {
throw new Error(
"Memory endpoint returned HTTP " + response.status
);
}
const memory = await response.json();
renderMemoryCenter(memory);
await refreshMemoryStats();
} catch (error) {
console.error("Could not load memory:", error);
if (list) {
list.innerHTML =
'<div class="empty-memory">' +
"Could not load memory. Check that Flask is running." +
"</div>";
}
}
}
function renderMemoryCenter(memory) {
const list = document.getElementById("memory-list");
if (!list) {
return;
}
list.innerHTML = "";
if (
!memory ||
typeof memory !== "object"
) {
list.innerHTML =
'<div class="empty-memory">No memory data available.</div>';
return;
}
const categoryInfo = {
personal: ["■", "Personal"],
education: ["■", "Education"],
career: ["■", "Career"],
learning: ["■", "Learning"],
preferences: ["■■", "Preferences"],
projects: ["■", "Projects"]
};
let count = 0;
Object.entries(memory).forEach(
([category, data]) => {
if (
!data ||
typeof data !== "object" ||
Array.isArray(data) ||
Object.keys(data).length === 0
) {
return;
}
const info =
categoryInfo[category] ||
["■", formatMemoryKey(category)];
const section =
document.createElement("section");
section.className =
"memory-category";
const heading =
document.createElement("div");
heading.className =
"memory-category-title";
heading.textContent =
info[0] + " " + info[1];
section.appendChild(heading);
Object.entries(data).forEach(
([key, value]) => {
if (Array.isArray(value)) {
value.forEach(
(item, index) => {
count++;
addMemoryCard(
section,
category,
key,
item,
index,
true
);
}
);
} else {
count++;
addMemoryCard(
section,
category,
key,
value,
null,
false
);
}
}
);
list.appendChild(section);
}
);
if (count === 0) {
list.innerHTML =
'<div class="empty-memory">' +
"No long-term memory is stored yet." +
"</div>";
}
}
function addMemoryCard(
container,
category,
key,
value,
index,
isList
) {
const card =
document.createElement("div");
card.className =
"memory-card";
const content =
document.createElement("div");
content.className =
"memory-card-content";
const keyElement =
document.createElement("div");
keyElement.className =
"memory-card-key";
keyElement.textContent =
formatMemoryKey(key);
const valueElement =
document.createElement("div");
valueElement.className =
"memory-card-value";
valueElement.textContent =
String(value);
content.appendChild(keyElement);
content.appendChild(valueElement);
const actions =
document.createElement("div");
actions.className =
"memory-card-actions";
const edit =
document.createElement("button");
edit.type = "button";
edit.className =
"memory-action-button";
edit.textContent = "Edit";
edit.addEventListener(
"click",
() => editMemory(
category,
key,
value,
index,
isList
)
);
const remove =
document.createElement("button");
remove.type = "button";
remove.className =
"memory-action-button danger";
remove.textContent = "Delete";
remove.addEventListener(
"click",
() => deleteMemory(
category,
key,
index,
isList
)
);
actions.appendChild(edit);
actions.appendChild(remove);
card.appendChild(content);
card.appendChild(actions);
container.appendChild(card);
}
async function editMemory(
category,
key,
value,
index,
isList
) {
try {
let newValue;
if (isList) {
const response =
await fetch("/memory");
if (!response.ok) {
throw new Error(
"Could not load memory."
);
}
const memory =
await response.json();
const current =
memory?.[category]?.[key];
if (!Array.isArray(current)) {
throw new Error(
"Memory list not found."
);
}
const replacement =
prompt(
"Edit this memory item:",
String(value)
);
if (replacement === null) {
return;
}
newValue = current.slice();
newValue[index] =
replacement.trim();
} else {
newValue =
prompt(
"Edit this memory:",
String(value)
);
if (newValue === null) {
return;
}
newValue =
newValue.trim();
if (!newValue) {
alert(
"Memory cannot be empty."
);
return;
}
}
await updateMemoryDirect(
category,
key,
newValue
);
} catch (error) {
console.error(
"Memory edit failed:",
error
);
alert(
"Could not edit memory."
);
}
}
async function deleteMemory(
category,
key,
index,
isList
) {
if (!confirm(
"Delete this memory?"
)) {
return;
}
try {
if (isList) {
const response =
await fetch("/memory");
if (!response.ok) {
throw new Error(
"Could not load memory."
);
}
const memory =
await response.json();
const current =
memory?.[category]?.[key];
if (!Array.isArray(current)) {
throw new Error(
"Memory list not found."
);
}
const updated =
current.slice();
updated.splice(index, 1);
await updateMemoryDirect(
category,
key,
updated
);
} else {
const response =
await fetch(
"/memory/" +
encodeURIComponent(category) +
"/" +
encodeURIComponent(key),
{
method: "DELETE"
}
);
const result =
await response.json();
if (
!response.ok ||
!result.success
) {
throw new Error(
result.message ||
"Delete failed."
);
}
renderMemoryCenter(
result.memory
);
updateMemoryStatsText(
result.stats
);
}
} catch (error) {
console.error(
"Memory delete failed:",
error
);
alert(
"Could not delete memory."
);
}
}
async function updateMemoryDirect(
category,
key,
value
) {
const response =
await fetch(
"/memory/update",
{
method: "POST",
headers: {
"Content-Type":
"application/json"
},
body: JSON.stringify({
category: category,
key: key,
value: value
})
}
);
const result =
await response.json();
if (
!response.ok ||
!result.success
) {
throw new Error(
result.message ||
"Memory update failed."
);
}
renderMemoryCenter(
result.memory
);
updateMemoryStatsText(
result.stats
);
}
async function deduplicateMemory() {
try {
const response =
await fetch(
"/memory/deduplicate",
{
method: "POST"
}
);
const result =
await response.json();
if (
!response.ok ||
!result.success
) {
throw new Error(
result.message ||
"Cleanup failed."
);
}
renderMemoryCenter(
result.memory
);
updateMemoryStatsText(
result.stats
);
} catch (error) {
console.error(
"Memory cleanup failed:",
error
);
alert(
"Could not clean memory."
);
}
}
async function clearAllMemory() {
if (!confirm(
"Clear ALL long-term memory?"
)) {
return;
}
if (!confirm(
"This cannot be undone. Continue?"
)) {
return;
}
try {
const response =
await fetch(
"/memory/clear",
{
method: "POST"
}
);
const result =
await response.json();
if (
!response.ok ||
!result.success
) {
throw new Error(
result.message ||
"Clear failed."
);
}
renderMemoryCenter(
result.memory
);
updateMemoryStatsText(
result.stats
);
} catch (error) {
console.error(
"Clear memory failed:",
error
);
alert(
"Could not clear memory."
);
}
}
async function refreshMemoryStats() {
try {
const response =
await fetch(
"/memory/stats"
);
if (!response.ok) {
return;
}
const result =
await response.json();
updateMemoryStatsText(
result.stats
);
} catch (error) {
console.error(
"Memory stats failed:",
error
);
}
}
function updateMemoryStatsText(stats) {
const element =
document.getElementById(
"memory-stats"
);
if (!element || !stats) {
return;
}
element.textContent =
String(stats.items || 0) +
" memories · " +
String(stats.categories || 0) +
" categories";
}
function formatMemoryKey(key) {
return String(key)
.replace(/_/g, " ")
.replace(
/\b\w/g,
letter =>
letter.toUpperCase()
);
}
// Wire buttons after the DOM exists.
function setupMemoryCenter() {
const memoryButtons =
document.querySelectorAll(
"#memoryToggle, #top-memory-button"
);
memoryButtons.forEach(
button => {
button.addEventListener(
"click",
openMemoryModal
);
}
);
const modal =
getMemoryModal();
if (modal) {
modal.addEventListener(
"click",
event => {
if (event.target === modal) {
closeMemory();
}
}
);
}
document.addEventListener(
"keydown",
event => {
if (
event.key === "Escape" &&
modal &&
modal.classList.contains("show")
) {
closeMemory();
}
}
);
}
if (
document.readyState === "loading"
) {
document.addEventListener(
"DOMContentLoaded",
setupMemoryCenter
);
} else {
setupMemoryCenter();
}
window.loadMemory = loadMemory;
window.openMemoryModal = openMemoryModal;
window.closeMemory = closeMemory;
window.editMemory = editMemory;
window.deleteMemory = deleteMemory;
window.clearAllMemory = clearAllMemory;
window.deduplicateMemory = deduplicateMemory;
// GLOBAL
// =====================================================
window.sendMessage =
sendMessage;
window.createNewChat =
createNewChat;
window.loadChat =
loadChat;
window.deleteChat =
deleteChat;
window.changePersonality =
changePersonality;
window.loadMemory =
loadMemory;
window.closeMemory =
closeMemory;
window.editMemory = editMemory;
window.deleteMemory = deleteMemory;
window.clearAllMemory = clearAllMemory;
window.deduplicateMemory = deduplicateMemory;
// ============================================================
// PERSONALITY THEME SWITCHER
// ============================================================
function applyPersonalityTheme(personality) {
const body = document.body;
if (!body) {
return;
}
// Keep both mechanisms synchronized:
// data-personality is used by the CSS and the theme-* class
// is kept for compatibility with the existing stylesheet.
body.dataset.personality = personality;
body.classList.remove(
"theme-general",
"theme-saffron",
"theme-coder",
"theme-mentor"
);
switch (personality) {
case "saffron":
body.classList.add("theme-saffron");
break;
case "coder":
body.classList.add("theme-coder");
break;
case "mentor":
body.classList.add("theme-mentor");
break;
case "general":
default:
body.classList.add("theme-general");
break;
}
console.log(
"■ Theme changed:",
personality
);
}
// ============================================================
// INITIAL THEME
// ============================================================
document.addEventListener(
"DOMContentLoaded",
function () {
applyPersonalityTheme(
currentPersonality
);
}
);
// =====================================================
// STEP 6 SAFE UI POLISH
// This layer does NOT replace the working streaming code.
// =====================================================
(function initSafeUIPolish() {
function getMessagesContainer() {
return document.querySelector("#messages, .messages, .chat-messages");
}
function getMessageText(el) {
return (el.dataset.rawText || el.innerText || "").trim();
}
async function copyText(text, button) {
if (!text) return;
try {
await navigator.clipboard.writeText(text);
const old = button.textContent;
button.textContent = "✓";
setTimeout(() => {
button.textContent = old;
}, 1000);
} catch (error) {
console.error("Copy failed:", error);
}
}
function addCopyButton(message) {
if (!message || message.classList.contains("user")) return;
if (message.querySelector(".safe-copy-button")) return;
const actions = document.createElement("div");
actions.className = "safe-message-actions";
const copy = document.createElement("button");
copy.type = "button";
copy.className = "safe-copy-button";
copy.textContent = "■";
copy.title = "Copy response";
copy.addEventListener("click", function(event) {
event.preventDefault();
event.stopPropagation();
copyText(getMessageText(message), copy);
});
actions.appendChild(copy);
message.appendChild(actions);
}
function addCodeCopyButtons(root) {
if (!root) return;
root.querySelectorAll(".code-block pre").forEach(function(pre) {
const block = pre.closest(".code-block");
if (!block) return;
if (block.querySelector(".safe-code-copy")) return;
const button = document.createElement("button");
button.type = "button";
button.className = "safe-code-copy";
button.textContent = "Copy";
button.title = "Copy code";
button.addEventListener("click", function(event) {
event.preventDefault();
event.stopPropagation();
copyText(pre.innerText || "", button);
});
block.style.position = "relative";
block.appendChild(button);
});
}
function refreshUI() {
const container = getMessagesContainer();
if (!container) return;
container.querySelectorAll(".message.bot").forEach(addCopyButton);
addCodeCopyButtons(container);
}
function startObserver() {
const container = getMessagesContainer();
if (!container || !window.MutationObserver) {
return;
}
const observer = new MutationObserver(function() {
refreshUI();
});
observer.observe(container, {
childList: true,
subtree: true
});
refreshUI();
}
function setup() {
refreshUI();
startObserver();
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", setup);
} else {
setup();
}
})();