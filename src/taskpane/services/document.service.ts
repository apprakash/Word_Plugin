// Document manipulation service
import { FormattingOptions } from '../models/interfaces';

/**
 * Write content to the document with specified position and formatting
 */
export async function writeToDocument(content: string, position: string, formatting: FormattingOptions): Promise<void> {
  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      
      // Split content by line breaks while preserving them
      const paragraphs = content.split(/\r?\n/);

      if (position === "replace_all") {
        body.clear();
      }
      
      // Determine insertion location
      const insertLocation = position === "start" ? Word.InsertLocation.start : Word.InsertLocation.end;
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraphText = paragraphs[i];
        
        // Skip empty paragraphs but add a blank line to preserve structure
        if (paragraphText.trim() === "") {
          body.insertParagraph("", insertLocation);
          continue;
        }
        
        // Insert the paragraph text
        const paragraph = body.insertParagraph(paragraphText, insertLocation);
        
        // Apply formatting if specified
        if (formatting) {
          if (formatting.bold !== undefined) {
            paragraph.font.bold = formatting.bold;
          }
          if (formatting.italic !== undefined) {
            paragraph.font.italic = formatting.italic;
          }
          if (formatting.underline !== undefined) {
            paragraph.font.underline = formatting.underline ? Word.UnderlineType.single : Word.UnderlineType.none;
          }
          if (formatting.color) {
            paragraph.font.color = formatting.color;
          }
          if (formatting.size) {
            paragraph.font.size = formatting.size;
          }
        }
      }
      
      // Sync the changes to the document
      await context.sync();
      
      // Show a success message
      const statusElement = document.createElement("div");
      statusElement.className = "status-message";
      statusElement.textContent = "Content added to document!";
      document.body.appendChild(statusElement);
      
      // Remove the status message after a few seconds
      setTimeout(() => {
        statusElement.remove();
      }, 3000);
    });
  } catch (error) {
    console.error("Error writing to document:", error);
    throw error;
  }
}

/**
 * Get the entire document content
 */
export async function getDocumentContent(): Promise<string> {
  try {
    return await Word.run(async (context) => {
      const body = context.document.body;
      body.load("text");
      await context.sync();
      return body.text;
    });
  } catch (error) {
    console.error("Error getting document content:", error);
    return "";
  }
}

/**
 * Replace text in the document
 */
export async function replaceTextInDocument(oldText: string, newText: string): Promise<void> {
  try {
    await Word.run(async (context) => {
      // Use more precise search to maintain formatting
      const searchResults = context.document.body.search(oldText, { 
        matchCase: true, 
        matchWholeWord: false,
        matchWildcards: false
      });
      
      context.load(searchResults, 'text');
      await context.sync();
      
      console.log(`Found ${searchResults.items.length} instances of "${oldText}"`);
      
      for (let i = 0; i < searchResults.items.length; i++) {
        // Get the range to preserve formatting
        const range = searchResults.items[i];
        
        // Load the range to ensure we have all properties
        context.load(range, ['text', 'paragraphs']);
        await context.sync();
        
        // Replace text while preserving formatting
        range.insertText(newText, Word.InsertLocation.replace);
      }
      
      await context.sync();
    });
  } catch (error) {
    console.error("Error replacing text:", error);
    throw error;
  }
}

/**
 * Insert a response into the Word document as a new paragraph
 */
export async function insertResponseToDocument(text: string): Promise<void> {
  try {
    await Word.run(async (context) => {
      // Insert the text at the end of the document
      const paragraph = context.document.body.insertParagraph(text, Word.InsertLocation.end);
      
      // Format the paragraph
      paragraph.font.color = "black";
      paragraph.font.size = 11;
      
      // Add some spacing before the paragraph
      paragraph.insertParagraph("", Word.InsertLocation.before);
      
      // Sync the changes to the document
      await context.sync();
    });
  } catch (error) {
    console.error("Error inserting response:", error);
    throw error;
  }
}
