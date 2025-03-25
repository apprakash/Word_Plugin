// Tool operations service
import { ToolOperation, ChatMessage } from '../models/interfaces';
import { writeToDocument, replaceTextInDocument } from './document.service';
import { addMessageToConversation } from './conversation.service';
import { addMessageToUI } from './ui.service';

/**
 * Process tool operations from Claude's response
 */
export async function processToolOperations(operations: ToolOperation[]): Promise<void> {
  for (const operation of operations) {
    try {
      if (operation.name === "text_editor") {
        await processTextEditorOperation(operation);
      } else if (operation.name === "document_writer") {
        await processDocumentWriterOperation(operation);
      }
    } catch (error) {
      console.error(`Error processing operation ${operation.name}:`, error);
    }
  }
}

/**
 * Process text editor operations
 */
async function processTextEditorOperation(operation: ToolOperation): Promise<void> {
  const command = operation.input.command;
  
  if (command === "view") {
    console.log("View operation processed");
  } else if (command === "str_replace") {
    const oldStr = operation.input.old_str;
    const newStr = operation.input.new_str;
    
    if (oldStr && newStr) {
      await replaceTextInDocument(oldStr, newStr);
      
      const replaceMessage: ChatMessage = {
        content: `I've replaced "${oldStr}" with "${newStr}" in your document.`,
        sender: "assistant" as "assistant",
        timestamp: new Date(),
      };
      
      addMessageToConversation(replaceMessage);
      addMessageToUI(replaceMessage);
    }
  }
}

/**
 * Process document writer operations
 */
async function processDocumentWriterOperation(operation: ToolOperation): Promise<void> {
  const content = operation.input.content;
  const position = operation.input.position || "end";
  const formatting = operation.input.formatting || {};
  
  if (content) {
    // For replace_all operations, ensure we're preserving document structure
    if (position === "replace_all") {
      console.log("Performing replace_all operation with formatting preservation");
    }
    
    await writeToDocument(content, position, formatting);
    
    const writeMessage: ChatMessage = {
      content: `I've added the requested content to your document while preserving formatting.`,
      sender: "assistant" as "assistant",
      timestamp: new Date(),
    };
    
    addMessageToConversation(writeMessage);
    addMessageToUI(writeMessage);
  }
}
