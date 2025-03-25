// UI service for handling user interface interactions
import { ChatMessage, Conversation } from '../models/interfaces';
import { getCurrentConversation, getAllConversations, loadConversation } from './conversation.service';

/**
 * Add a message to the UI
 */
export function addMessageToUI(message: ChatMessage): void {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${message.sender}`;

  const contentElement = document.createElement("div");
  contentElement.className = "message-content";
  contentElement.textContent = message.content;

  const timeElement = document.createElement("div");
  timeElement.className = "message-time";
  timeElement.textContent = formatTime(message.timestamp);

  messageElement.appendChild(contentElement);
  messageElement.appendChild(timeElement);
  chatMessages.appendChild(messageElement);

  // Scroll to the bottom of the chat
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Render the current conversation in the UI
 */
export function renderCurrentConversation(): void {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  // Clear existing messages
  chatMessages.innerHTML = "";

  const conversation = getCurrentConversation();
  if (conversation) {
    // Add all messages to the UI
    conversation.messages.forEach(message => {
      addMessageToUI(message);
    });
  }
}

/**
 * Update the past conversations UI
 */
export function updatePastConversationsUI(): void {
  const pastConversations = document.getElementById("past-conversations");
  if (!pastConversations) return;

  // Clear existing conversations
  pastConversations.innerHTML = "";

  // Add all conversations to the UI
  const conversations = getAllConversations();
  conversations.forEach(conversation => {
    const listItem = document.createElement("li");
    listItem.className = "past-conversation-item";
    listItem.dataset.id = conversation.id;
    
    // Create a container for better layout
    const contentContainer = document.createElement("div");
    contentContainer.className = "conversation-content";
    
    // Title with truncation if needed
    const titleElement = document.createElement("div");
    titleElement.className = "conversation-title";
    titleElement.textContent = conversation.title || "New Conversation";
    
    // Date in a readable format
    const timeElement = document.createElement("div");
    timeElement.className = "conversation-time";
    timeElement.textContent = formatDate(conversation.timestamp);
    
    // Add elements to container
    contentContainer.appendChild(titleElement);
    contentContainer.appendChild(timeElement);
    listItem.appendChild(contentContainer);
    
    // Add click event to load conversation
    listItem.addEventListener("click", () => {
      // Load the selected conversation
      const success = loadConversation(conversation.id);
      
      if (success) {
        renderCurrentConversation();
        
        // Highlight the selected conversation
        document.querySelectorAll(".past-conversation-item").forEach(el => {
          el.classList.remove("selected");
        });
        listItem.classList.add("selected");
        
        console.log(`Loaded conversation: ${conversation.id}`);
      } else {
        console.error(`Failed to load conversation: ${conversation.id}`);
      }
    });
    
    pastConversations.appendChild(listItem);
  });
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
