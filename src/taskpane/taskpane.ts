/// <reference types="office-js" />
import Anthropic from "@anthropic-ai/sdk";

// Interface for chat messages
interface ChatMessage {
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

// Interface for past conversations
interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

// Store for conversations
let conversations: Conversation[] = [];
let currentConversation: Conversation | null = null;

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
  // Create a new conversation if none exists
  if (!currentConversation) {
    createNewConversation();
  }

  // Set up event listeners
  const sendButton = document.getElementById("send-message");
  const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;

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

  // Load past conversations if any
  loadPastConversations();
}

/**
 * Create a new conversation
 */
function createNewConversation(): void {
  currentConversation = {
    id: generateId(),
    title: "New Conversation",
    timestamp: new Date(),
    messages: [
      {
        content: "Hello! I'm AskJunior Assistant. How can I help with your document today?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ],
  };

  // Add to conversations array
  conversations.push(currentConversation);

  // Save to local storage
  saveConversations();
}

/**
 * Generate a unique ID for conversations
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Send a message from the user input
 */
function sendMessage(): void {
  const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
  const content = chatInput.value.trim();

  if (content && currentConversation) {
    // Add user message
    const userMessage: ChatMessage = {
      content,
      sender: "user",
      timestamp: new Date(),
    };

    currentConversation.messages.push(userMessage);

    // Update UI
    addMessageToUI(userMessage);

    // Clear input
    chatInput.value = "";

    // Process the message and generate a response
    processUserMessage(content);

    // Update conversation title if it's the first user message
    if (currentConversation.messages.length === 2) {
      currentConversation.title = content.substring(0, 30) + (content.length > 30 ? "..." : "");
      updatePastConversationsUI();
    }

    saveConversations();
  }
}

async function processUserMessage(content: string): Promise<void> {
  try {
    const apiKey = "";
    const anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: "Respond only with short poems.",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    });

    let aiResponse = "Sorry, I couldn't generate a response.";
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if ("text" in firstContent) {
        aiResponse = firstContent.text;
      }
    }

    const assistantMessage: ChatMessage = {
      content: aiResponse,
      sender: "assistant",
      timestamp: new Date(),
    };

    if (currentConversation) {
      currentConversation.messages.push(assistantMessage);
      addMessageToUI(assistantMessage);
      await insertResponseToDocument(aiResponse);
      saveConversations();
    }
  } catch (error) {
    console.error("Error in processUserMessage:", error);
    const errorChatMessage: ChatMessage = {
      content: "Sorry, I couldn't generate a response.",
      sender: "assistant",
      timestamp: new Date(),
    };
    addMessageToUI(errorChatMessage);
    if (currentConversation) {
      currentConversation.messages.push(errorChatMessage);
      saveConversations();
    }
  }
}

/**
 * Add a message to the UI
 */
function addMessageToUI(message: ChatMessage): void {
  const chatMessages = document.getElementById("chat-messages");

  if (chatMessages) {
    // Use the template to create a new message element
    const template = document.getElementById("message-template") as HTMLTemplateElement;
    if (!template) {
      console.error("Message template not found");
      return;
    }

    // Clone the template content
    const messageElement = template.content.cloneNode(true) as DocumentFragment;
    const messageDiv = messageElement.querySelector(".message") as HTMLDivElement;

    // Add the appropriate class based on sender
    messageDiv.classList.add(message.sender);
    const contentElement = messageDiv.querySelector(".message-content") as HTMLDivElement;
    contentElement.textContent = message.content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/**
 * Insert a response into the Word document as a new paragraph
 */
async function insertResponseToDocument(text: string): Promise<void> {
  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      const paragraph = body.insertParagraph(text, Word.InsertLocation.end);

      // Optional: Add some formatting to the paragraph
      paragraph.font.bold = false;
      paragraph.font.color = "black";

      // Add a blank line after the response
      body.insertParagraph("", Word.InsertLocation.end);

      // Sync the changes to the document
      await context.sync();

      // Show a success message (optional)
      const statusElement = document.createElement("div");
      statusElement.className = "status-message";
      statusElement.textContent = "Response added to document!";
      document.body.appendChild(statusElement);

      // Remove the status message after a few seconds
      setTimeout(() => {
        statusElement.remove();
      }, 3000);
    });
  } catch (error) {
    console.error("Error inserting response to document:", error);
    alert("Failed to insert response into document. Please try again.");
  }
}

/**
 * Save conversations to local storage
 */
function saveConversations(): void {
  try {
    localStorage.setItem("askJuniorConversations", JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversations:", error);
  }
}

/**
 * Load past conversations from local storage
 */
function loadPastConversations(): void {
  try {
    const savedConversations = localStorage.getItem("askJuniorConversations");

    if (savedConversations) {
      conversations = JSON.parse(savedConversations);

      // Set current conversation to the most recent one
      if (conversations.length > 0) {
        currentConversation = conversations[conversations.length - 1];
        renderCurrentConversation();
      }
      updatePastConversationsUI();
    }
  } catch (error) {
    console.error("Error loading conversations:", error);
  }
}

/**
 * Render the current conversation in the UI
 */
function renderCurrentConversation(): void {
  const chatMessages = document.getElementById("chat-messages");

  if (chatMessages && currentConversation) {
    chatMessages.innerHTML = "";
    currentConversation.messages.forEach((message) => {
      addMessageToUI(message);
    });
  }
}

/**
 * Update the past conversations UI
 */
function updatePastConversationsUI(): void {
  const pastConversationsList = document.getElementById("past-conversations");

  if (pastConversationsList) {
    pastConversationsList.innerHTML = "";
    const sortedConversations = [...conversations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Add conversation items
    sortedConversations.forEach((conversation) => {
      const listItem = document.createElement("li");
      listItem.textContent = conversation.title;
      listItem.dataset.id = conversation.id;

      listItem.addEventListener("click", () => {
        loadConversation(conversation.id);
      });
      pastConversationsList.appendChild(listItem);
    });
  }
}

/**
 * Load a specific conversation by ID
 */
function loadConversation(id: string): void {
  const conversation = conversations.find((c) => c.id === id);
  if (conversation) {
    currentConversation = conversation;
    renderCurrentConversation();
  }
}

export async function run(): Promise<void> {
  return Word.run(async (context) => {
    const paragraph = context.document.body.insertParagraph("Hello World", Word.InsertLocation.end);
    paragraph.font.color = "blue";
    await context.sync();
  });
}
