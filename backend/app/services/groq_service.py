"""
Groq AI service for STT, LLM, and TTS integration.

Provides three core AI capabilities:
  1. STT (Speech-to-Text) — Groq Whisper for audio transcription
  2. LLM (Language Model) — Groq Llama-3.3-70b for conversation and triage
  3. TTS (Text-to-Speech) — ElevenLabs for audio response generation

Design decisions:
  - Single service class encapsulates all AI interactions.
  - Global singleton instance for reuse across the application.
  - Temperature tuned per use case: 0.3 for triage (deterministic),
    0.8 for conversation (natural, varied).
  - TTS gracefully degrades — if ElevenLabs fails, conversation continues.
"""

from groq import Groq
import aiohttp
from ..config import settings
import logging
import json

logger = logging.getLogger(__name__)


class GroqService:
    """
    Service for interacting with Groq API (LLM + STT) and ElevenLabs (TTS).

    Attributes:
        client: Groq SDK client instance.
        stt_model: Whisper model identifier for speech-to-text.
        llm_model: LLM model identifier for text generation.
        elevenlabs_api_key: API key for ElevenLabs TTS service.
        elevenlabs_voice_id: Voice ID for TTS output (Rachel — warm, professional).
    """

    def __init__(self):
        """
        Initialize the Groq service with API clients and configuration.

        Note: GROQ_API_KEY and ELEVENLABS_API_KEY must be set in the .env file.
              See .env.example for the required format.
        """
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.stt_model = settings.STT_MODEL
        self.llm_model = settings.LLM_MODEL

        # TTS configuration — ElevenLabs
        self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
        self.elevenlabs_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice (warm, professional)

    async def transcribe_audio(self, audio_file) -> str:
        """
        Transcribe audio to text using Groq Whisper.

        Args:
            audio_file: Audio file object (file-like with .name attribute)

        Returns:
            Transcribed text string.

        Raises:
            Exception: If transcription fails (network error, invalid audio, etc.)
        """
        try:
            transcription = self.client.audio.transcriptions.create(
                file=audio_file,
                model=self.stt_model,
                response_format="text"
            )
            return transcription
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            raise

    async def generate_response(self, messages: list, temperature: float = 0.7) -> str:
        """
        Generate AI response using Groq LLM.

        Args:
            messages: List of message dicts [{"role": "...", "content": "..."}].
            temperature: Sampling temperature (0 = deterministic, 2 = creative).

        Returns:
            Generated text response string.

        Raises:
            Exception: If LLM API call fails.
        """
        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.llm_model,
                temperature=temperature,
                max_tokens=1024
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise

    async def generate_speech(self, text: str) -> bytes:
        """
        Generate speech audio from text using ElevenLabs TTS.

        Args:
            text: Text to convert to speech.

        Returns:
            Raw audio bytes (MP3 format).

        Raises:
            Exception: If TTS API call fails.
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.elevenlabs_voice_id}"

                payload = {
                    "text": text,
                    "model_id": "eleven_flash_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                        "style": 0.0,
                        "use_speaker_boost": True
                    }
                }

                headers = {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": self.elevenlabs_api_key
                }

                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        audio_data = await response.read()
                        logger.info(f"TTS audio generated: {len(audio_data)} bytes")
                        return audio_data
                    else:
                        error_text = await response.text()
                        logger.error(f"ElevenLabs TTS API error: {response.status} - {error_text}")
                        raise Exception(f"TTS API error: {response.status}")

        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise

    async def triage_symptoms(self, symptoms: str) -> dict:
        """
        Analyze symptoms and provide triage recommendation.

        Uses a low temperature (0.3) for more deterministic, reliable
        medical triage responses. Falls back to a safe default if
        JSON parsing fails.

        Args:
            symptoms: Patient's described symptoms text.

        Returns:
            Dictionary with keys: severity, advice, needs_appointment, urgency, department.
        """
        system_prompt = """You are a medical triage AI assistant for a hospital. 
Your role is to:
1. Assess symptom severity (low, moderate, high, emergency)
2. Provide appropriate home care advice for minor issues
3. Recommend whether an appointment is needed
4. Be empathetic and professional

Respond ONLY with valid JSON in this exact format:
{
    "severity": "low|moderate|high|emergency",
    "advice": "Home care advice or immediate action needed",
    "needs_appointment": true/false,
    "urgency": "routine|urgent|immediate",
    "department": "suggested department if appointment needed"
}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Patient symptoms: {symptoms}"}
        ]

        try:
            response = await self.generate_response(messages, temperature=0.3)
            # Parse JSON response — strip markdown code fences if present
            cleaned = response.strip()
            if cleaned.startswith("```"):
                # Remove markdown code block wrapping
                lines = cleaned.split("\n")
                cleaned = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned
            return json.loads(cleaned)
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Error in symptom triage: {e}")
            # Return safe default that recommends seeing a doctor
            return {
                "severity": "moderate",
                "advice": "Please consult with a healthcare provider for proper evaluation.",
                "needs_appointment": True,
                "urgency": "routine",
                "department": "General Medicine"
            }

    async def generate_conversation_response(self, conversation_history: list) -> str:
        """
        Generate conversational response for the chat interface.

        Uses a higher temperature (0.8) for natural, varied conversation.
        The system prompt establishes the AI's role as a hospital receptionist.

        Args:
            conversation_history: List of previous messages [{"role": "...", "content": "..."}].

        Returns:
            Generated response text string.
        """
        system_prompt = """You are a friendly and professional hospital receptionist AI assistant.

Your goals:
- Greet patients warmly and professionally
- Ask about their symptoms clearly and empathetically
- Provide helpful advice based on their description
- Offer to schedule appointments when needed
- Share information about hospital departments, doctors, and services when asked
- Be concise (2-3 sentences max per response)
- Show empathy and professionalism at all times
- If asked about specific doctors or departments, provide relevant information

Remember: You are NOT a doctor. You do not diagnose. You help patients navigate the hospital system and connect them with the right department or doctor."""

        messages = [{"role": "system", "content": system_prompt}] + conversation_history

        return await self.generate_response(messages, temperature=0.8)


# Global singleton instance
groq_service = GroqService()
