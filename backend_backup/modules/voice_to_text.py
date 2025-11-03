"""
Voice to Text Module using Deepgram API
"""
from .config import Config
from fastapi import HTTPException, UploadFile
from typing import Optional

class VoiceToText:
    """Handles voice-to-text conversion using Deepgram"""
    
    def __init__(self):
        self.deepgram = Config.get_deepgram()
    
    async def transcribe_audio(self, audio_file: UploadFile) -> str:
        """
        Transcribe audio file to text using Deepgram
        
        Args:
            audio_file: Audio file (wav, mp3, webm, etc.)
            
        Returns:
            Transcribed text
        """
        if not self.deepgram:
            raise HTTPException(status_code=503, detail="Deepgram API not configured")
        
        try:
            # Read audio data
            audio_data = await audio_file.read()
            
            # Prepare audio source
            source = {
                "buffer": audio_data,
            }
            
            # Configure transcription options
            options = {
                "model": "nova-2",
                "language": "en",
                "smart_format": True,
                "punctuate": True,
            }
            
            # Transcribe audio
            response = self.deepgram.listen.rest.v("1").transcribe_file(
                source,
                options
            )
            
            # Extract transcript
            if response and hasattr(response, 'results'):
                results = response.results
                if hasattr(results, 'channels') and results.channels:
                    channel = results.channels[0]
                    if hasattr(channel, 'alternatives') and channel.alternatives:
                        alternative = channel.alternatives[0]
                        transcript = alternative.transcript
                        confidence = getattr(alternative, 'confidence', 0.0)
                        
                        print(f"🎤 Transcribed: '{transcript}' (confidence: {confidence:.2f})")
                        
                        if not transcript or transcript.strip() == "":
                            raise HTTPException(status_code=400, detail="No speech detected in audio")
                        
                        return transcript
            
            raise HTTPException(status_code=400, detail="No speech detected in audio")
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Deepgram transcription error: {e}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    async def transcribe_audio_hindi_english(self, audio_file: UploadFile, language: str = "en") -> str:
        """
        Transcribe audio with language selection (Hindi/English)
        
        Args:
            audio_file: Audio file
            language: 'en' for English, 'hi' for Hindi
            
        Returns:
            Transcribed text
        """
        if not self.deepgram:
            raise HTTPException(status_code=503, detail="Deepgram API not configured")
        
        # Validate language
        if language not in ['en', 'hi']:
            language = 'en'
        
        try:
            audio_data = await audio_file.read()
            
            source = {
                "buffer": audio_data,
            }
            
            # Configure for specific language
            options = {
                "model": "nova-2",
                "language": language,
                "smart_format": True,
                "punctuate": True,
            }
            
            response = self.deepgram.listen.rest.v("1").transcribe_file(
                source,
                options
            )
            
            if response and hasattr(response, 'results'):
                results = response.results
                if hasattr(results, 'channels') and results.channels:
                    channel = results.channels[0]
                    if hasattr(channel, 'alternatives') and channel.alternatives:
                        alternative = channel.alternatives[0]
                        transcript = alternative.transcript
                        confidence = getattr(alternative, 'confidence', 0.0)
                        
                        lang_name = "Hindi" if language == "hi" else "English"
                        print(f"🎤 Transcribed ({lang_name}): '{transcript}' (confidence: {confidence:.2f})")
                        
                        if not transcript or transcript.strip() == "":
                            raise HTTPException(status_code=400, detail="No speech detected in audio")
                        
                        return transcript
            
            raise HTTPException(status_code=400, detail="No speech detected in audio")
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Deepgram transcription error: {e}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

voice_to_text = VoiceToText()
