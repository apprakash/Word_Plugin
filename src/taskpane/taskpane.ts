/// <reference types="office-js" />
// Import services
import { getAIResponse } from './services/ai.service';
import { getDocumentContent, insertResponseToDocument } from './services/document.service';
import { createNewConversation, addMessageToConversation, loadPastConversations, getCurrentConversation } from './services/conversation.service';
import { addMessageToUI, renderCurrentConversation, updatePastConversationsUI } from './services/ui.service';
import { processToolOperations } from './services/tool.service';
import { ChatMessage } from './models/interfaces';

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
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
    // Get document content to provide context
    const documentContent = await getDocumentContent();
    
    // Get AI response
    const { aiResponse, toolOperations } = await getAIResponse(content, documentContent);
    
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
