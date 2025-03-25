// AI service for handling interactions with Anthropic
import Anthropic from "@anthropic-ai/sdk";
import { ToolOperation } from '../models/interfaces';

// Hardcoded API key as per user preference
const API_KEY = "";

/**
 * Get AI response from Anthropic's Claude
 */
export async function getAIResponse(userRequest: string, documentContent: string): Promise<{
  aiResponse: string;
  toolOperations: ToolOperation[];
}> {
  try {
    const anthropic = new Anthropic({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: "You are a helpful document assistant. You can view document content and make changes to it. You have the following tools available: 1) text_editor - for replacing text in the document, 2) document_writer - for writing content directly to the document. Always use document_writer when you need to add substantial content to the document. IMPORTANT: When making small changes like updating dates or specific text, always use text_editor with str_replace to preserve the existing formatting. When using document_writer with replace_all, always preserve the original document structure including paragraph breaks, line spacing, and indentation. Never collapse formatted text into a single paragraph when making edits.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Document content: ${documentContent}\n\nUser request: ${userRequest}`
            }
          ]
        }
      ],
      tools: [
        {
          name: "text_editor",
          description: "Tool for viewing and editing document content",
          input_schema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                enum: ["view", "str_replace"],
                description: "The command to execute: 'view' to see document content, 'str_replace' to replace text"
              },
              old_str: {
                type: "string",
                description: "The text to be replaced (only for str_replace command)"
              },
              new_str: {
                type: "string",
                description: "The new text to replace with (only for str_replace command)"
              }
            },
            required: ["command"]
          }
        },
        {
          name: "document_writer",
          description: "Tool for writing content directly to the document",
          input_schema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The content to write to the document"
              },
              position: {
                type: "string",
                enum: ["start", "end", "replace_all"],
                description: "Where to insert the content: 'start' for beginning of document, 'end' for end of document, 'replace_all' to replace entire document content"
              },
              formatting: {
                type: "object",
                properties: {
                  bold: {
                    type: "boolean",
                    description: "Whether the text should be bold"
                  },
                  italic: {
                    type: "boolean",
                    description: "Whether the text should be italic"
                  },
                  underline: {
                    type: "boolean",
                    description: "Whether the text should be underlined"
                  },
                  color: {
                    type: "string",
                    description: "The color of the text (e.g., 'red', '#FF0000')"
                  },
                  size: {
                    type: "number",
                    description: "The font size in points"
                  }
                }
              }
            },
            required: ["content", "position"]
          }
        }
      ]
    });

    let aiResponse = "";
    const toolOperations: ToolOperation[] = [];
    
    if (response.content && response.content.length > 0) {
      for (const item of response.content) {
        if (item.type === "text") {
          aiResponse += item.text;
        } else if (item.type === "tool_use") {
          toolOperations.push({
            name: item.name,
            input: item.input
          });
        }
      }
    }

    return { aiResponse, toolOperations };
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { aiResponse: "Sorry, I encountered an error. Please try again.", toolOperations: [] };
  }
}
