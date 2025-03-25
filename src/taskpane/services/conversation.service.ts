// Conversation management service
import { Conversation, ChatMessage } from '../models/interfaces';

// Store for conversations
let conversations: Conversation[] = [];
let currentConversation: Conversation | null = null;

/**
 * Create a new conversation
 */
export function createNewConversation(): Conversation {
  const newConversation: Conversation = {
    id: generateId(),
    title: "New Conversation",
    timestamp: new Date(),
    messages: [
      {
        content: "Hello! I'm AskJunior Assistant. How can I help with your document today?",
        sender: "assistant" as "assistant", // Explicitly type as literal "assistant"
        timestamp: new Date(),
      },
    ],
  };

  conversations.push(newConversation);
  currentConversation = newConversation;
  saveConversations();
  return newConversation;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Add a message to the current conversation
 */
export function addMessageToConversation(message: ChatMessage): void {
  if (currentConversation) {
    currentConversation.messages.push(message);
    
    // Update conversation title if it's the first user message
    if (currentConversation.messages.length === 2 && message.sender === "user") {
      currentConversation.title = message.content.substring(0, 30) + (message.content.length > 30 ? "..." : "");
    }
    
    saveConversations();
  }
}

/**
 * Save conversations to local storage
 */
export function saveConversations(): void {
  try {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversations:", error);
  }
}

/**
 * Load past conversations from local storage
 */
export function loadPastConversations(): Conversation[] {
  try {
    const savedConversations = localStorage.getItem("conversations");
    if (savedConversations) {
      conversations = JSON.parse(savedConversations);
      
      // Convert string dates back to Date objects
      conversations.forEach(conversation => {
        conversation.timestamp = new Date(conversation.timestamp);
        conversation.messages.forEach(message => {
          message.timestamp = new Date(message.timestamp);
        });
      });
    }
    
    // If there are conversations, set the current one to the most recent
    if (conversations.length > 0) {
      currentConversation = conversations[conversations.length - 1];
    } else {
      createNewConversation();
    }
    
    return conversations;
  } catch (error) {
    console.error("Error loading conversations:", error);
    conversations = [];
    createNewConversation();
    return conversations;
  }
}

/**
 * Load a specific conversation by ID
 */
export function loadConversation(id: string): boolean {
  const conversation = conversations.find(conv => conv.id === id);
  if (conversation) {
    currentConversation = conversation;
    console.log(`Successfully loaded conversation: ${id}`);
    return true;
  } else {
    console.error(`Conversation not found with ID: ${id}`);
    return false;
  }
}

/**
 * Get the current conversation
 */
export function getCurrentConversation(): Conversation | null {
  return currentConversation;
}

/**
 * Get all conversations
 */
export function getAllConversations(): Conversation[] {
  return conversations;
}

/**
 * Clear all conversations and create a new one
 */
export function clearAllConversations(): void {
  conversations = [];
  saveConversations();
  createNewConversation();
}
