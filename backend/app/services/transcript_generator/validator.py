import re # Import re module
from typing import List, Set, Dict
from app.core.models import ConceptRequest

class TranscriptValidator:
    @staticmethod
    def validate_transcript(transcript: str, request: ConceptRequest) -> None:
        """
        Validate the generated transcript format and content.
        
        Args:
            transcript: Generated transcript text
            request: Original concept request
            
        Raises:
            ValueError: If validation fails
        """
        # Split into lines and clean
        lines = [line.strip() for line in transcript.split('\n') if line.strip()]
        
        # Validate format using regex: Check for "Any Name: " pattern
        # This is more flexible than checking against only requested characters.
        invalid_lines = [
            line for line in lines 
            if not re.match(r"^[^:]+:\s+", line) 
        ]
        if invalid_lines:
            # Keep the error message clear about the expected format
            raise ValueError(
                f"Transcript format invalid. Each line must start with a speaker name followed by ':' and a space. "
                f"Invalid lines found: {invalid_lines[:3]}"
            )

        # --- Case-Insensitive Speaker Checks ---
        # Extract speakers found, converting to lowercase for comparison
        speakers_found_raw = set(line.split(':', 1)[0].strip() for line in lines if ':' in line)
        speakers_found_lower = {name.lower() for name in speakers_found_raw}
        
        # Convert requested names to lowercase set for comparison
        # **Also strip whitespace from requested names here**
        requested_speakers_lower = {name.strip().lower() for name in request.character_names}
        requested_speakers_original_case_map = {name.strip().lower(): name.strip() for name in request.character_names} # Map lower to stripped original

        print(f"Speakers found (case-insensitive): {speakers_found_lower}") # Debugging output
        print(f"Requested speakers (cleaned, lower): {requested_speakers_lower}") # Add debug for cleaned requested speakers
        
        # Check for missing speakers using lowercase sets
        missing_speakers_lower = requested_speakers_lower - speakers_found_lower
        if missing_speakers_lower:
            # Report missing speakers using their original requested casing for clarity
            missing_original_case = {requested_speakers_original_case_map[lower_name] for lower_name in missing_speakers_lower}
            print(f"Missing speakers (case-insensitive check): {missing_original_case}") # Debugging output
            raise ValueError(f"Some requested speakers are missing from the transcript: {', '.join(sorted(missing_original_case))}")

        # Check for balanced participation using speakers present in both lists (case-insensitive intersection)
        present_speakers_lower = speakers_found_lower.intersection(requested_speakers_lower)
        
        # Get the original casing of present speakers for counting and reporting
        present_speakers_original_case = {requested_speakers_original_case_map[lower_name] for lower_name in present_speakers_lower}

        if len(present_speakers_original_case) > 1: # Only check balance if multiple requested speakers are present
            speaker_counts = {}
            for name_original in present_speakers_original_case:
                # Count lines starting with the speaker name, case-insensitively
                pattern = re.compile(rf"^{re.escape(name_original)}:\s+", re.IGNORECASE)
                count = sum(1 for line in lines if pattern.match(line))
                speaker_counts[name_original] = count
                
            print(f"Speaker counts (case-insensitive match): {speaker_counts}") # Debugging output

            valid_counts = [count for count in speaker_counts.values() if count > 0]
            if len(valid_counts) > 1:
                min_count = min(valid_counts)
                max_count = max(valid_counts)
                # Allow a larger difference, e.g., 3x, as participation can vary naturally
                if max_count > min_count * 3: 
                    print(f"Warning: Speaker participation might be unbalanced: {speaker_counts}")
                    # Consider making this a warning instead of an error
                    # raise ValueError("Speaker participation is too unbalanced")
            elif not valid_counts and len(present_speakers_original_case) > 0: # Check if present speakers somehow have 0 lines
                 print(f"Warning: No lines found for present requested speakers (check might be flawed): {present_speakers_original_case}")

        # Check for speakers present but not requested (use raw found speakers vs original requested names for this)
        # This comparison remains case-sensitive intentionally to flag exact mismatches if needed, 
        # or could be made case-insensitive too if preferred. Let's keep it sensitive for now to see unexpected *casings*.
        unrequested_speakers_raw = speakers_found_raw - set(request.character_names) 
        if unrequested_speakers_raw:
            print(f"Warning: Speakers present in transcript that differ in case or were not in original request: {', '.join(sorted(unrequested_speakers_raw))}")
        # --- End Case-Insensitive Speaker Checks --- 