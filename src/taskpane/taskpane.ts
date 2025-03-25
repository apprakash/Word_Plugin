/// <reference types="office-js" />
// Import services
import { getAIResponse } from './services/ai.service';
import { getDocumentContent, insertResponseToDocument } from './services/document.service';
import { createNewConversation, addMessageToConversation, loadPastConversations } from './services/conversation.service';
import { addMessageToUI, renderCurrentConversation, updatePastConversationsUI } from './services/ui.service';
import { processToolOperations } from './services/tool.service';
import { ChatMessage } from './models/interfaces';

// API Key storage key
const API_KEY_STORAGE_KEY = 'anthropic_api_key';

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    initializeChatInterface();
  }
});

/**
 * Initialize the chat interface and event listeners
 */
function initializeChatInterface(): void {
  // Load past conversations or create a new one if none exists
  loadPastConversations();
  
  // Render the current conversation
  renderCurrentConversation();
  
  // Update the past conversations UI
  updatePastConversationsUI();

  // Check if API key exists and show appropriate UI
  checkApiKey();

  // Set up event listeners
  const sendButton = document.getElementById("send-message");
  const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
  const newChatButton = document.getElementById("new-chat");

  if (sendButton && chatInput) {
    // Send message on button click
    sendButton.addEventListener("click", () => {
      sendMessage();
    });

    // Send message on Enter key (but allow Shift+Enter for new lines)
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }
  
  if (newChatButton) {
    newChatButton.addEventListener("click", () => {
      createNewConversation();
      renderCurrentConversation();
      updatePastConversationsUI();
    });
  }
}

/**
 * Check if API key exists and show/hide API key input accordingly
 */
function checkApiKey(): void {
  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  const appBody = document.getElementById("app-body");
  const apiKeyContainer = document.getElementById("api-key-container");
  
  if (!apiKey) {
    // Show API key input if no key is stored
    if (appBody) appBody.style.display = "none";
    if (apiKeyContainer) apiKeyContainer.style.display = "block";
  } else {
    // Show chat interface if key is already stored
    if (appBody) appBody.style.display = "block";
    if (apiKeyContainer) apiKeyContainer.style.display = "none";
  }

  // Set up API key form submission
  const apiKeyForm = document.getElementById("api-key-form");
  if (apiKeyForm) {
    apiKeyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveApiKey();
    });
  }
}

/**
 * Save the API key from the input field
 */
function saveApiKey(): void {
  const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
  if (apiKeyInput && apiKeyInput.value.trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.value.trim());
    
    // Show chat interface after saving API key
    const appBody = document.getElementById("app-body");
    const apiKeyContainer = document.getElementById("api-key-container");
    
    if (appBody) appBody.style.display = "block";
    if (apiKeyContainer) apiKeyContainer.style.display = "none";
  }
}

/**
 * Get the stored API key
 */
function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

/**
 * Send a message from the user input
 */
function sendMessage(): void {
  const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
  const content = chatInput.value.trim();

  if (content) {
    const userMessage: ChatMessage = {
      content,
      sender: "user" as "user",
      timestamp: new Date(),
    };

    addMessageToConversation(userMessage);
    addMessageToUI(userMessage);
    chatInput.value = "";
    processUserMessage(content);
    
    // Update the past conversations UI in case the title changed
    updatePastConversationsUI();
  }
}

/**
 * Process a user message and get a response from the AI
 */
async function processUserMessage(content: string): Promise<void> {
  try {
    // Get API key
    const apiKey = getApiKey();
    
    // Check if API key exists
    if (!apiKey) {
      const errorMessage: ChatMessage = {
        content: "Please provide your Anthropic API key to continue.",
        sender: "assistant" as "assistant",
        timestamp: new Date(),
      };
      
      addMessageToConversation(errorMessage);
      addMessageToUI(errorMessage);
      
      // Show API key input
      const appBody = document.getElementById("app-body");
      const apiKeyContainer = document.getElementById("api-key-container");
      
      if (appBody) appBody.style.display = "none";
      if (apiKeyContainer) apiKeyContainer.style.display = "block";
      
      return;
    }
    
    // Get document content to provide context
    const documentContent = await getDocumentContent();
    
    // Get AI response with API key
    const { aiResponse, toolOperations } = await getAIResponse(content, documentContent, apiKey);
    
    // Add the assistant's response to the conversation
    if (aiResponse) {
      const assistantMessage: ChatMessage = {
        content: aiResponse,
        sender: "assistant" as "assistant",
        timestamp: new Date(),
      };
      
      addMessageToConversation(assistantMessage);
      addMessageToUI(assistantMessage);
    }
    
    // Process any tool operations
    if (toolOperations.length > 0) {
      await processToolOperations(toolOperations);
    } else if (aiResponse) {
      // If no tool operations, just insert the response to document
      await insertResponseToDocument(aiResponse);
    }
  } catch (error) {
    console.error("Error processing message:", error);
    
    // Add an error message to the conversation
    const errorMessage: ChatMessage = {
      content: "Sorry, I encountered an error. Please try again.",
      sender: "assistant" as "assistant",
      timestamp: new Date(),
    };
    
    addMessageToConversation(errorMessage);
    addMessageToUI(errorMessage);
  }
}

export async function run(): Promise<void> {
  return Word.run(async (context) => {
    // Initialize the add-in
    await context.sync();
  });
}
