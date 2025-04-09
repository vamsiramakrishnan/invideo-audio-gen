// frontend/src/utils/transcriptUtils.ts

// Define the structure for a single dialogue turn
export interface DialogTurn {
  speaker: string;
  content: string;
  id: string; // For stable keys and reordering
  audioUrl?: string; // Add audio URL for individual segments
}

/**
 * Parses a transcript string into an array of DialogTurn objects.
 * Lines are expected in the format "Speaker: Dialogue content".
 * Lines not matching the format are appended to the previous turn's content.
 * @param text The transcript string.
 * @returns An array of DialogTurn objects.
 */
export const parseTranscript = (text: string): DialogTurn[] => {
  if (!text) return [];
  return text.split('\n')
    .reduce<DialogTurn[]>((acc, line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        acc.push({
          speaker: match[1].trim(),
          content: match[2].trim(),
          id: crypto.randomUUID(), // Generate unique ID for each new turn
          audioUrl: undefined // Initialize audioUrl as undefined
        });
      } else if (line.trim() && acc.length > 0) {
        // Append to last turn if it's a continuation
        // Ensure space is added only if content exists
        const lastTurn = acc[acc.length - 1];
        lastTurn.content = lastTurn.content ? lastTurn.content + ' ' + line.trim() : line.trim();
      }
      // Ignore empty lines or lines that appear before the first speaker tag
      return acc;
    }, []);
};

/**
 * Converts an array of DialogTurn objects back into a transcript string.
 * @param dialogTurns The array of DialogTurn objects.
 * @returns A formatted transcript string.
 */
export const turnsToText = (dialogTurns: DialogTurn[]): string => {
  return dialogTurns.map(turn => `${turn.speaker}: ${turn.content}`).join('\n');
}; 