"""
Enhanced Voice to Text Module with Multilingual Support
Handles voice transcription using Deepgram API with improved features
"""
from fastapi import UploadFile, HTTPException
from modules.config import Config
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
)
import io


class VoiceToText:
    """Enhanced voice transcription handler with multilingual support"""
    
    def __init__(self):
        self.deepgram = Config.get_deepgram()
        if not self.deepgram:
            print("⚠️  Deepgram client not initialized")
        
        # Supported languages for music queries
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi',
            'auto': 'Auto-detect'
        }
    
    async def transcribe_audio(self, file: UploadFile, language: str = 'auto') -> str:
        """
        Enhanced transcription with auto language detection
        
        Args:
            file: Audio file (WAV, MP3, OGG, WEBM, etc.)
            language: Language code ('en', 'hi', or 'auto' for detection)
        
        Returns:
            str: Transcribed text with improved accuracy
        """
        if not self.deepgram:
            raise HTTPException(
                status_code=503,
                detail="Deepgram not configured. Add DEEPGRAM_API_KEY to .env"
            )
        
        try:
            # Read audio file
            audio_data = await file.read()
            
            # Validate audio data
            if len(audio_data) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Empty audio file received"
                )
            
            # Prepare audio for Deepgram
            payload: FileSource = {
                "buffer": audio_data,
            }
            
            # Enhanced transcription options
            if language == 'auto':
                # Auto-detect language (English or Hindi)
                options = PrerecordedOptions(
                    model="nova-2",
                    detect_language=True,
                    smart_format=True,
                    punctuate=True,
                    diarize=False,
                    utterances=False,
                    # Enhanced for music queries
                    keywords=[
                        "play:3",
                        "song:3", 
                        "artist:3",
                        "recommend:3",
                        "music:3",
                        "hindi:2",
                        "english:2",
                        "bollywood:2"
                    ],
                    search=["play", "song", "music", "artist"]
                )
            else:
                # Specific language
                options = PrerecordedOptions(
                    model="nova-2",
                    language=language,
                    smart_format=True,
                    punctuate=True,
                    diarize=False,
                    utterances=False,
                    keywords=[
                        "play:3",
                        "song:3", 
                        "artist:3",
                        "recommend:3",
                        "music:3"
                    ]
                )
            
            # Transcribe with timeout handling
            response = self.deepgram.listen.prerecorded.v("1").transcribe_file(
                payload, options
            )
            
            # Extract transcript and metadata
            channel = response.results.channels[0]
            transcript = channel.alternatives[0].transcript
            
            # Get detected language if auto-detect was used
            detected_language = None
            if language == 'auto' and hasattr(channel, 'detected_language'):
                detected_language = channel.detected_language
                print(f"🌍 Detected language: {detected_language}")
            
            # Validate transcript
            if not transcript or len(transcript.strip()) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No speech detected in audio. Please speak clearly and try again."
                )
            
            # Clean and return transcript
            cleaned_transcript = transcript.strip()
            print(f"✅ Transcribed ({detected_language or language}): {cleaned_transcript}")
            
            return cleaned_transcript
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Deepgram transcription error: {e}")
            error_msg = str(e)
            
            # User-friendly error messages
            if "timeout" in error_msg.lower():
                detail = "Transcription timeout. Audio might be too long or unclear."
            elif "network" in error_msg.lower():
                detail = "Network error. Please check your internet connection."
            else:
                detail = f"Transcription failed: {error_msg}"
            
            raise HTTPException(status_code=500, detail=detail)
    
    async def transcribe_audio_hindi_english(self, file: UploadFile, language: str = "en") -> str:
        """
        Transcribe with specific language (Hindi or English)
        
        Args:
            file: Audio file
            language: Language code ("en" for English, "hi" for Hindi)
        
        Returns:
            str: Transcribed text in specified language
        """
        return await self.transcribe_audio(file, language)
    
    async def transcribe_audio_multilang(self, file: UploadFile) -> dict:
        """
        Auto-detect language and transcribe with detailed response
        
        Args:
            file: Audio file
        
        Returns:
            dict: Contains transcript, detected_language, and confidence
        """
        if not self.deepgram:
            raise HTTPException(
                status_code=503,
                detail="Deepgram not configured. Add DEEPGRAM_API_KEY to .env"
            )
        
        try:
            # Read audio file
            audio_data = await file.read()
            
            if len(audio_data) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Empty audio file received"
                )
            
            # Prepare audio for Deepgram
            payload: FileSource = {
                "buffer": audio_data,
            }
            
            # Configure with language detection
            options = PrerecordedOptions(
                model="nova-2",
                detect_language=True,
                smart_format=True,
                punctuate=True,
                diarize=False,
                utterances=False,
                keywords=[
                    "play:3",
                    "song:3", 
                    "artist:3",
                    "recommend:3",
                    "music:3",
                    "hindi:2",
                    "bollywood:2"
                ]
            )
            
            # Transcribe
            response = self.deepgram.listen.prerecorded.v("1").transcribe_file(
                payload, options
            )
            
            # Extract detailed information
            channel = response.results.channels[0]
            alternative = channel.alternatives[0]
            transcript = alternative.transcript
            confidence = alternative.confidence if hasattr(alternative, 'confidence') else None
            detected_language = getattr(channel, 'detected_language', 'unknown')
            
            if not transcript or len(transcript.strip()) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No speech detected in audio"
                )
            
            result = {
                "transcript": transcript.strip(),
                "detected_language": detected_language,
                "confidence": confidence,
                "language_name": self.supported_languages.get(detected_language, detected_language)
            }
            
            print(f"🌍 Multilang result: {result['detected_language']} - {result['transcript'][:50]}...")
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Deepgram multilang error: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Transcription failed: {str(e)}"
            )
    
    async def transcribe_with_timestamps(self, file: UploadFile) -> dict:
        """
        Transcribe with word-level timestamps (useful for music lyrics alignment)
        
        Args:
            file: Audio file
        
        Returns:
            dict: Transcript with word timestamps
        """
        if not self.deepgram:
            raise HTTPException(
                status_code=503,
                detail="Deepgram not configured"
            )
        
        try:
            audio_data = await file.read()
            
            payload: FileSource = {
                "buffer": audio_data,
            }
            
            # Enable word timestamps
            options = PrerecordedOptions(
                model="nova-2",
                detect_language=True,
                smart_format=True,
                punctuate=True,
                utterances=True,  # Enable utterances for timestamps
                diarize=False,
            )
            
            response = self.deepgram.listen.prerecorded.v("1").transcribe_file(
                payload, options
            )
            
            channel = response.results.channels[0]
            transcript = channel.alternatives[0].transcript
            
            # Extract words with timestamps if available
            words_with_timestamps = []
            if hasattr(channel.alternatives[0], 'words'):
                for word_info in channel.alternatives[0].words:
                    words_with_timestamps.append({
                        "word": word_info.word,
                        "start": word_info.start,
                        "end": word_info.end,
                        "confidence": getattr(word_info, 'confidence', None)
                    })
            
            return {
                "transcript": transcript.strip(),
                "words": words_with_timestamps,
                "detected_language": getattr(channel, 'detected_language', 'unknown')
            }
            
        except Exception as e:
            print(f"❌ Timestamp transcription error: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Transcription with timestamps failed: {str(e)}"
            )
    
    def get_supported_languages(self) -> dict:
        """Get list of supported languages"""
        return self.supported_languages


# Create singleton instance
voice_to_text = VoiceToText()
