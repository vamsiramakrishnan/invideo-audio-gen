from typing import Dict
from app.core.models import ExpertiseLevel, FormatStyle, ConceptRequest

class PromptGenerator:
    # Descriptions for different expertise levels
    EXPERTISE_DESCRIPTIONS: Dict[ExpertiseLevel, str] = {
        ExpertiseLevel.beginner: "using simple terms and basic concepts, making it accessible to newcomers",
        ExpertiseLevel.intermediate: "balancing basic and advanced concepts, with some technical terminology",
        ExpertiseLevel.expert: "using advanced concepts and technical terminology for a knowledgeable audience",
        ExpertiseLevel.mixed: "varying the complexity to accommodate different knowledge levels"
    }

    # Descriptions for different format styles
    FORMAT_DESCRIPTIONS: Dict[FormatStyle, str] = {
        FormatStyle.casual: "a relaxed, conversational style with natural back-and-forth dialogue",
        FormatStyle.interview: "a structured interview format with clear questions and detailed responses",
        FormatStyle.debate: "a balanced debate with different viewpoints and respectful disagreements",
        FormatStyle.educational: "an informative discussion that breaks down complex topics clearly",
        FormatStyle.storytelling: "an engaging narrative style that weaves information into a compelling story"
    }

    @classmethod
    def create_podcast_prompt(cls, request: ConceptRequest) -> str:
        """
        Create a detailed prompt for podcast transcript generation.
        
        Args:
            request: ConceptRequest containing podcast parameters
            
        Returns:
            str: Formatted prompt for the AI model
        """
        return f"""Create a natural and engaging podcast transcript about {request.topic}.

Context:
- Format: {cls.FORMAT_DESCRIPTIONS[request.format_style]}
- Expertise Level: {cls.EXPERTISE_DESCRIPTIONS[request.expertise_level]}
- Duration: Aim for {request.duration_minutes} minutes of spoken content
- Speakers: {', '.join(request.character_names)}

Requirements:
1. Format Rules (STRICTLY FOLLOW THESE):
   - Each line must follow the exact format: "SpeakerName: Their dialogue text"
   - One line per speaker turn, no multi-line dialogues
   - No empty lines between speakers
   - Speaker names must exactly match: {', '.join(request.character_names)}
   - Example format:
     John: Hello everyone, welcome to the podcast.
     Sarah: Thanks for having me here.
     John: Let's dive into our topic.

2. Structure:
   - Start with a brief introduction of the speakers and topic
   - Develop the discussion naturally through {request.duration_minutes} minutes
   - End with clear conclusions or takeaways

3. Speaker Dynamics:
   - Maintain distinct personalities for each speaker
   - Include natural interactions and balanced dialogue
   - Ensure each speaker gets roughly equal speaking time

4. Content Flow:
   - Progress logically through subtopics
   - Include relevant examples and real-world applications
   - Mix serious discussion with appropriate lighter moments

Remember:
- Keep the expertise level consistent: {cls.EXPERTISE_DESCRIPTIONS[request.expertise_level]}
- Maintain the {cls.FORMAT_DESCRIPTIONS[request.format_style]}
- IMPORTANT: Strictly follow the format "SpeakerName: Text" with one line per speaker

Begin the transcript:""" 