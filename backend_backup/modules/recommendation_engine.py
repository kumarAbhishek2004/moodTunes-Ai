"""
Recommendation Engine - Precise Distribution: 8 (Artist+Mood+Lang) + 4 (Lang+Mood) + 4 (Similar+Mood) + Fallback
"""
from typing import List, Optional, Dict, Set
from .config import Config
from .models import Song, PersonalizedRecommendationRequest, RecommendationRequest
from .music_player import music_player
from .mood_detection import MoodDetector
from fastapi import HTTPException
from datetime import datetime
from collections import defaultdict
import re

class RecommendationEngine:
    
    # Language to tag mapping - ONLY Hindi and English
    LANGUAGE_TO_TAG = {
        'hindi': 'bollywood',
        'english': 'pop'
    }
    
    def __init__(self):
        self.lastfm = Config.get_lastfm()
        self.user_history = defaultdict(list)
        self.user_favorites = defaultdict(list)
        self._track_cache = {}
    
    def track_to_song(self, track, skip_youtube: bool = False) -> Song:
        """Convert Last.fm track to Song"""
        title = ""
        artist_name = ""
        url = None
        playcount = None
        
        try:
            title = track.title if hasattr(track, 'title') else str(track)
        except:
            title = str(track)
        
        try:
            if hasattr(track, 'artist'):
                artist_obj = track.artist
                artist_name = artist_obj.name if hasattr(artist_obj, 'name') else str(artist_obj)
        except:
            artist_name = ""
        
        try:
            if hasattr(track, 'get_url'):
                url = track.get_url()
        except:
            pass
        
        try:
            if hasattr(track, 'get_playcount'):
                playcount = track.get_playcount()
        except:
            pass
        
        youtube_id = None
        if not skip_youtube and title and artist_name:
            youtube_id = music_player.get_youtube_id(f"{artist_name} {title}")
        
        song_id = f"{artist_name}_{title}".replace(" ", "_").lower()[:50]
        
        return Song(
            id=song_id,
            name=title,
            artist=artist_name,
            lastfm_url=url,
            youtube_id=youtube_id,
            preview_url=f"https://www.youtube.com/watch?v={youtube_id}" if youtube_id else None,
            album=None,
            duration_ms=None,
            listeners=None,
            playcount=int(playcount) if playcount else None,
            tags=[],
            audio_features={}
        )
    
    def get_top_tracks_by_tag(self, tag: str, limit: int = 20) -> List[Song]:
        """Get top tracks by tag"""
        songs = []
        if not self.lastfm:
            return songs
        
        try:
            tag_obj = self.lastfm.get_tag(tag)
            top_tracks = tag_obj.get_top_tracks(limit=limit)
            
            for track_info in top_tracks:
                try:
                    track_obj = track_info[0] if isinstance(track_info, (list, tuple)) else track_info
                    song = self.track_to_song(track_obj, skip_youtube=True)
                    songs.append(song)
                except:
                    continue
        except Exception as e:
            print(f"Error for tag '{tag}': {e}")
        
        return songs
    
    def get_artist_top_tracks(self, artist_name: str, limit: int = 10, mood_filter: Optional[str] = None) -> List[Song]:
        """Get artist's top tracks, optionally filtered by mood"""
        songs = []
        if not self.lastfm:
            return songs
        
        try:
            print(f"  🎤 Fetching tracks for: {artist_name}")
            if mood_filter:
                print(f"     🎭 Filtering by mood: {mood_filter}")
            
            artist = self.lastfm.get_artist(artist_name)
            # Get more tracks initially to filter by mood
            fetch_limit = limit * 3 if mood_filter else limit
            top_tracks = artist.get_top_tracks()[:fetch_limit]
            
            for track_info in top_tracks:
                if len(songs) >= limit:
                    break
                    
                try:
                    track_obj = track_info[0] if isinstance(track_info, (list, tuple)) else track_info
                    
                    # If mood filter is set, check if track matches mood
                    if mood_filter:
                        try:
                            # Get track tags to check mood
                            track_tags = track_obj.get_tags() if hasattr(track_obj, 'get_tags') else []
                            track_tag_names = [tag.name.lower() if hasattr(tag, 'name') else str(tag).lower() for tag in track_tags]
                            
                            # Get mood tags for comparison
                            mood_tags = [tag.lower() for tag in MoodDetector.get_mood_tags(mood_filter)]
                            
                            # Check if any mood tag matches
                            matches_mood = any(mood_tag in track_tag_names for mood_tag in mood_tags)
                            
                            # Also check track name for mood keywords
                            track_title = track_obj.title.lower() if hasattr(track_obj, 'title') else str(track_obj).lower()
                            mood_keywords = {
                                'happy': ['happy', 'joy', 'celebration', 'party', 'dance', 'fun', 'upbeat'],
                                'sad': ['sad', 'cry', 'tears', 'heartbreak', 'alone', 'lonely', 'miss'],
                                'energetic': ['energy', 'power', 'rock', 'pump', 'workout', 'beast'],
                                'calm': ['calm', 'peace', 'relax', 'soft', 'slow', 'soothing'],
                                'romantic': ['love', 'romantic', 'heart', 'pyaar', 'ishq', 'mohabbat'],
                                'intense': ['intense', 'powerful', 'dramatic', 'epic']
                            }
                            
                            keyword_match = False
                            if mood_filter in mood_keywords:
                                keyword_match = any(keyword in track_title for keyword in mood_keywords[mood_filter])
                            
                            # Skip if doesn't match mood (but accept if no tags available)
                            if track_tags and not matches_mood and not keyword_match:
                                print(f"     ⊘ Skipped (mood mismatch): {track_obj.title}")
                                continue
                        except:
                            # If error checking tags, include the song
                            pass
                    
                    song = self.track_to_song(track_obj, skip_youtube=True)
                    songs.append(song)
                    print(f"     ✓ Added: {song.name} by {song.artist}")
                except Exception as e:
                    print(f"     ✗ Error converting track: {e}")
                    continue
            
            print(f"  ✓ Got {len(songs)} tracks from {artist_name}" + (f" (mood-filtered: {mood_filter})" if mood_filter else ""))
        except Exception as e:
            print(f"  ✗ Error getting tracks for {artist_name}: {e}")
        
        return songs
    
    def search_by_artist(self, artist_name: str, limit: int = 10, mood_filter: Optional[str] = None) -> List[Song]:
        """Search songs by specific artist, optionally filtered by mood"""
        if not self.lastfm:
            return []
        
        print(f"🎤 Searching for artist: {artist_name}")
        if mood_filter:
            print(f"   🎭 With mood filter: {mood_filter}")
        songs = self.get_artist_top_tracks(artist_name, limit=limit, mood_filter=mood_filter)
        
        # Add YouTube IDs
        for song in songs:
            if not song.youtube_id and song.name and song.artist:
                youtube_id = music_player.get_youtube_id(f"{song.artist} {song.name}")
                if youtube_id:
                    song.youtube_id = youtube_id
                    song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"
        
        return songs
    
    def search_track(self, name: str, artist: Optional[str] = None) -> Optional[Song]:
        """
        Search for a specific track by name and optionally artist
        
        Args:
            name: Song name to search for
            artist: Optional artist name to narrow search
            
        Returns:
            Song object if found, None otherwise
        """
        if not self.lastfm:
            return None
        
        try:
            # Create cache key
            cache_key = f"{artist}_{name}".lower() if artist else name.lower()
            
            # Check cache first
            if cache_key in self._track_cache:
                print(f"✓ Cache hit for: {name} by {artist}")
                return self._track_cache[cache_key]
            
            print(f"🔍 Searching for track: {name}" + (f" by {artist}" if artist else ""))
            
            # Search using Last.fm API
            if artist:
                # Direct track lookup with artist
                try:
                    track = self.lastfm.get_track(artist, name)
                    song = self.track_to_song(track, skip_youtube=False)
                    
                    # Cache the result
                    self._track_cache[cache_key] = song
                    print(f"✓ Found: {song.name} by {song.artist}")
                    return song
                except Exception as e:
                    print(f"  Direct lookup failed: {e}")
            
            # Fallback: Search by track name
            search_results = self.lastfm.search_for_track(artist or '', name)
            matches = search_results.get_next_page() if hasattr(search_results, 'get_next_page') else list(search_results)
            
            if matches:
                # Convert first match to Song
                first_match = matches[0]
                song = self.track_to_song(first_match, skip_youtube=False)
                
                # Cache the result
                self._track_cache[cache_key] = song
                print(f"✓ Found via search: {song.name} by {song.artist}")
                return song
            
            print(f"✗ No results found for: {name}" + (f" by {artist}" if artist else ""))
            return None
            
        except Exception as e:
            print(f"✗ Error searching for track '{name}': {e}")
            return None
    
    def get_similar_tracks(self, track_name: str, artist: str, limit: int = 5, mood_filter: Optional[str] = None) -> List[Song]:
        """Get similar tracks based on a favorite song, optionally filtered by mood"""
        if not self.lastfm:
            return []
        
        songs = []
        try:
            track = self.lastfm.get_track(artist, track_name)
            # Get more tracks if mood filtering
            fetch_limit = limit * 3 if mood_filter else limit
            similar = track.get_similar(limit=fetch_limit)
            
            for similar_track in similar:
                if len(songs) >= limit:
                    break
                    
                try:
                    track_obj = similar_track[0] if isinstance(similar_track, (list, tuple)) else similar_track
                    
                    # If mood filter is set, check if track matches mood
                    if mood_filter:
                        try:
                            # Get track tags
                            track_tags = track_obj.get_tags() if hasattr(track_obj, 'get_tags') else []
                            track_tag_names = [tag.name.lower() if hasattr(tag, 'name') else str(tag).lower() for tag in track_tags]
                            
                            # Get mood tags
                            mood_tags = [tag.lower() for tag in MoodDetector.get_mood_tags(mood_filter)]
                            
                            # Check if matches mood
                            matches_mood = any(mood_tag in track_tag_names for mood_tag in mood_tags)
                            
                            # Check title for mood keywords
                            track_title = track_obj.title.lower() if hasattr(track_obj, 'title') else str(track_obj).lower()
                            mood_keywords = {
                                'happy': ['happy', 'joy', 'celebration', 'party', 'dance'],
                                'sad': ['sad', 'cry', 'tears', 'heartbreak', 'alone'],
                                'energetic': ['energy', 'power', 'rock', 'pump'],
                                'calm': ['calm', 'peace', 'relax', 'soft'],
                                'romantic': ['love', 'romantic', 'heart', 'pyaar'],
                                'intense': ['intense', 'powerful', 'dramatic']
                            }
                            
                            keyword_match = False
                            if mood_filter in mood_keywords:
                                keyword_match = any(keyword in track_title for keyword in mood_keywords[mood_filter])
                            
                            # Skip if doesn't match mood
                            if track_tags and not matches_mood and not keyword_match:
                                continue
                        except:
                            pass
                    
                    song = self.track_to_song(track_obj, skip_youtube=True)
                    songs.append(song)
                except:
                    continue
        except Exception as e:
            print(f"Error getting similar tracks: {e}")
        
        return songs
    
    def add_favorite_song(self, user_id: str, song_name: str, artist: str) -> Dict:
        """Add a song to user's favorites"""
        favorite = {
            'name': song_name,
            'artist': artist,
            'added_at': datetime.now().isoformat()
        }
        
        # Check if already in favorites
        existing = [f for f in self.user_favorites[user_id] 
                   if f['name'].lower() == song_name.lower() 
                   and f['artist'].lower() == artist.lower()]
        
        if not existing:
            self.user_favorites[user_id].append(favorite)
            return {"message": "Added to favorites", "favorite": favorite}
        else:
            return {"message": "Already in favorites", "favorite": existing[0]}
    
    def get_favorites(self, user_id: str) -> Dict:
        """Get user's favorite songs"""
        favorites = self.user_favorites[user_id]
        return {"user_id": user_id, "total": len(favorites), "favorites": favorites}
    
    def remove_favorite(self, user_id: str, song_name: str, artist: str) -> Dict:
        """Remove a song from favorites"""
        original_count = len(self.user_favorites[user_id])
        self.user_favorites[user_id] = [
            f for f in self.user_favorites[user_id]
            if not (f['name'].lower() == song_name.lower() 
                   and f['artist'].lower() == artist.lower())
        ]
        
        removed = original_count > len(self.user_favorites[user_id])
        return {"removed": removed, "remaining": len(self.user_favorites[user_id])}
    
    def get_personalized_recommendations(self, request: PersonalizedRecommendationRequest) -> Dict:
        """
        Get personalized recommendations with EXACT distribution:
        - 8 songs: Artist + Mood + Language (40%)
        - 4 songs: Language + Mood (20%)
        - 4 songs: Similar to Favorite Songs + Mood (20%)
        - Remaining: Fallback (at least Language-based) (20%)
        """
        if not self.lastfm:
            raise HTTPException(status_code=503, detail="Last.fm not configured")
        
        mood = request.mood.lower()
        if not MoodDetector.validate_mood(mood):
            raise HTTPException(status_code=400, detail=f"Invalid mood: {mood}")
        
        prefs = request.preferences
        
        # Normalize language
        language = prefs.get('language', '').lower()
        if language not in ['hindi', 'english']:
            print(f"⚠️  Invalid language '{language}', defaulting to 'english'")
            language = 'english'
        
        # Extract favorite data with multiple field name variations
        favorite_songs = (
            prefs.get('favoriteSongs') or 
            prefs.get('favorite_songs') or 
            prefs.get('favouriteSongs') or 
            []
        )
        
        favorite_singers = (
            prefs.get('favoriteSingers') or 
            prefs.get('favorite_artists') or 
            prefs.get('favorite_singers') or
            prefs.get('favouriteSingers') or
            []
        )
        
        # Ensure arrays are lists
        if isinstance(favorite_songs, str):
            favorite_songs = [s.strip() for s in favorite_songs.split(',') if s.strip()]
        if isinstance(favorite_singers, str):
            favorite_singers = [s.strip() for s in favorite_singers.split(',') if s.strip()]
        
        print(f"\n{'='*60}")
        print(f"🎵 PERSONALIZED RECOMMENDATION REQUEST")
        print(f"{'='*60}")
        print(f"Language: {language.upper()}")
        print(f"Mood: {mood.upper()}")
        print(f"Favorite Singers: {favorite_singers}")
        print(f"Favorite Songs: {favorite_songs}")
        print(f"Target Total: {request.limit} songs")
        print(f"{'='*60}\n")
        
        all_songs = []
        added = set()
        
        # Get tags
        mood_tags = MoodDetector.get_mood_tags(mood)
        language_tag = self.LANGUAGE_TO_TAG.get(language, 'pop')
        
        print(f"🏷️  Tags - Language: '{language_tag}', Mood: {mood_tags}\n")
        
        # Category counts
        cat1_count = 0  # Artist + Mood + Language
        cat2_count = 0  # Language + Mood
        cat3_count = 0  # Similar + Mood
        cat4_count = 0  # Fallback
        
        # ============================================================
        # CATEGORY 1: Artist + Mood + Language - EXACTLY 8 songs
        # ============================================================
        TARGET_CAT1 = 8
        
        if favorite_singers:
            print(f"📌 CATEGORY 1: Getting EXACTLY {TARGET_CAT1} songs (Artist + Mood + Language)")
            songs_per_artist = max(3, TARGET_CAT1 // len(favorite_singers[:3]))
            
            for singer in favorite_singers[:3]:
                if cat1_count >= TARGET_CAT1:
                    break
                    
                print(f"  🎤 Artist: {singer}")
                artist_songs = self.get_artist_top_tracks(
                    singer, 
                    limit=songs_per_artist * 2,  # Get extra for filtering
                    mood_filter=mood
                )
                
                for song in artist_songs:
                    if cat1_count >= TARGET_CAT1:
                        break
                    key = f"{song.name}-{song.artist}".lower()
                    if key not in added:
                        added.add(key)
                        all_songs.append(song)
                        cat1_count += 1
                        print(f"     ✓ Added: {song.name}")
            
            print(f"  ✅ Category 1: {cat1_count}/{TARGET_CAT1} songs\n")
        else:
            print(f"⏭️  CATEGORY 1: Skipped (no favorite artists)\n")
        
        # ============================================================
        # CATEGORY 2: Language + Mood - EXACTLY 4 songs
        # ============================================================
        TARGET_CAT2 = 4
        
        print(f"📌 CATEGORY 2: Getting EXACTLY {TARGET_CAT2} songs (Language + Mood)")
        
        # Combine language and mood songs
        combined_pool = []
        
        # Get language songs
        print(f"  🌍 Fetching {language} songs...")
        lang_songs = self.get_top_tracks_by_tag(language_tag, limit=20)
        combined_pool.extend(lang_songs)
        print(f"     Retrieved {len(lang_songs)} language songs")
        
        # Get mood songs
        if mood_tags:
            print(f"  😊 Fetching mood songs...")
            for mood_tag in mood_tags[:2]:
                mood_songs = self.get_top_tracks_by_tag(mood_tag, limit=15)
                combined_pool.extend(mood_songs)
                print(f"     Retrieved {len(mood_songs)} for '{mood_tag}'")
        
        # Add unique songs
        for song in combined_pool:
            if cat2_count >= TARGET_CAT2:
                break
            key = f"{song.name}-{song.artist}".lower()
            if key not in added:
                added.add(key)
                all_songs.append(song)
                cat2_count += 1
        
        print(f"  ✅ Category 2: {cat2_count}/{TARGET_CAT2} songs\n")
        
        # ============================================================
        # CATEGORY 3: Similar to Favorite Songs + Mood - EXACTLY 4 songs
        # ============================================================
        TARGET_CAT3 = 4
        
        if favorite_songs:
            print(f"📌 CATEGORY 3: Getting EXACTLY {TARGET_CAT3} songs (Similar + Mood)")
            songs_per_favorite = max(2, TARGET_CAT3 // len(favorite_songs[:3]))
            
            for fav_song in favorite_songs[:3]:
                if cat3_count >= TARGET_CAT3:
                    break
                
                # Parse song format
                if ' - ' in fav_song:
                    parts = fav_song.split(' - ')
                    song_name = parts[0].strip()
                    artist_name = parts[1].strip() if len(parts) > 1 else ''
                else:
                    song_name = fav_song.strip()
                    artist_name = favorite_singers[0] if favorite_singers else ''
                
                if not artist_name:
                    print(f"  ⚠️  Skipping '{song_name}' - no artist")
                    continue
                
                print(f"  ❤️  Finding similar to: '{song_name}' by {artist_name}")
                similar_songs = self.get_similar_tracks(
                    song_name, 
                    artist_name, 
                    limit=songs_per_favorite * 2,
                    mood_filter=mood
                )
                
                print(f"     Found {len(similar_songs)} similar songs")
                
                for song in similar_songs:
                    if cat3_count >= TARGET_CAT3:
                        break
                    key = f"{song.name}-{song.artist}".lower()
                    if key not in added:
                        added.add(key)
                        all_songs.append(song)
                        cat3_count += 1
                        print(f"     ✓ Added: {song.name}")
            
            print(f"  ✅ Category 3: {cat3_count}/{TARGET_CAT3} songs\n")
        else:
            print(f"⏭️  CATEGORY 3: Skipped (no favorite songs)\n")
        
        # ============================================================
        # CATEGORY 4: FALLBACK - Fill remaining (minimum language-based)
        # ============================================================
        remaining = request.limit - len(all_songs)
        
        if remaining > 0:
            print(f"📌 CATEGORY 4: FALLBACK - Need {remaining} more songs")
            
            fallback_pool = []
            
            # Priority 1: Language-based songs (MANDATORY)
            print(f"  🌍 Fetching more {language} songs...")
            lang_fallback = self.get_top_tracks_by_tag(language_tag, limit=remaining * 3)
            fallback_pool.extend(lang_fallback)
            print(f"     Retrieved {len(lang_fallback)} language songs")
            
            # Priority 2: Mood-based songs
            if mood_tags:
                print(f"  😊 Fetching more mood songs...")
                for mood_tag in mood_tags:
                    mood_fallback = self.get_top_tracks_by_tag(mood_tag, limit=remaining * 2)
                    fallback_pool.extend(mood_fallback)
                    print(f"     Retrieved {len(mood_fallback)} for '{mood_tag}'")
            
            # Priority 3: Popular tracks from language
            print(f"  ⭐ Fetching popular {language} tracks...")
            popular = self.get_top_tracks_by_tag(language_tag, limit=30)
            fallback_pool.extend(popular)
            
            # Add unique songs
            for song in fallback_pool:
                if len(all_songs) >= request.limit:
                    break
                key = f"{song.name}-{song.artist}".lower()
                if key not in added:
                    added.add(key)
                    all_songs.append(song)
                    cat4_count += 1
            
            print(f"  ✅ Category 4: {cat4_count}/{remaining} songs\n")
        
        # Sort by popularity
        all_songs.sort(key=lambda x: (x.playcount or 0), reverse=True)
        final = all_songs[:request.limit]
        
        print(f"\n{'='*60}")
        print(f"✅ FINAL DISTRIBUTION")
        print(f"{'='*60}")
        print(f"Total Songs: {len(final)}/{request.limit}")
        print(f"├─ Cat 1 (Artist+Mood+Lang): {cat1_count} songs")
        print(f"├─ Cat 2 (Language+Mood): {cat2_count} songs")
        print(f"├─ Cat 3 (Similar+Mood): {cat3_count} songs")
        print(f"└─ Cat 4 (Fallback): {cat4_count} songs")
        print(f"{'='*60}\n")
        
        # Add YouTube IDs
        print("🎬 Fetching YouTube IDs...")
        youtube_success = 0
        for i, song in enumerate(final, 1):
            if not song.youtube_id and song.name and song.artist:
                youtube_id = music_player.get_youtube_id(f"{song.artist} {song.name}")
                if youtube_id:
                    song.youtube_id = youtube_id
                    song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"
                    youtube_success += 1
            if i % 5 == 0:
                print(f"   Processed {i}/{len(final)} songs...")
        
        print(f"✅ YouTube IDs: {youtube_success}/{len(final)} successful\n")
        
        # Update user history
        for s in final:
            self.user_history[request.user_id].append({
                'song': s.dict(),
                'mood': mood,
                'language': language,
                'timestamp': datetime.now().isoformat(),
                'source': 'personalized'
            })
        
        return {
            "songs": final,
            "mood": mood,
            "language": language,
            "total": len(final),
            "distribution": {
                "artist_based": cat1_count,
                "language_mood": cat2_count,
                "similar_tracks": cat3_count,
                "fallback": cat4_count
            },
            "preferences_applied": {
                "language": language,
                "favorite_singers_count": len(favorite_singers),
                "favorite_songs_count": len(favorite_songs)
            }
        }
    
    def get_basic_recommendations(self, request: RecommendationRequest) -> Dict:
        """Basic mood-based recommendations (no personalization)"""
        if not self.lastfm:
            raise HTTPException(status_code=503, detail="Last.fm not configured")
        
        mood = request.mood.lower()
        if not MoodDetector.validate_mood(mood):
            raise HTTPException(status_code=400, detail=f"Invalid mood: {mood}")
        
        mood_tags = MoodDetector.get_mood_tags(mood)
        recommendations = []
        added = set()
        
        print(f"\n🎵 Basic Recommendations for mood: {mood}")
        print(f"Tags: {mood_tags}\n")
        
        for tag in mood_tags:
            if len(recommendations) >= request.limit:
                break
            
            songs = self.get_top_tracks_by_tag(tag, limit=15)
            for s in songs:
                key = f"{s.name}-{s.artist}".lower()
                if key not in added and len(recommendations) < request.limit:
                    added.add(key)
                    recommendations.append(s)
        
        # Add YouTube IDs
        for song in recommendations:
            if not song.youtube_id and song.name and song.artist:
                youtube_id = music_player.get_youtube_id(f"{song.artist} {song.name}")
                if youtube_id:
                    song.youtube_id = youtube_id
                    song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"
        
        print(f"✅ Retrieved {len(recommendations)} songs\n")
        
        return {
            "songs": recommendations,
            "mood": mood,
            "total": len(recommendations)
        }
    
    def search_music(self, query: str, limit: int = 10) -> Dict:
        """Search music by name or artist"""
        if not self.lastfm:
            raise HTTPException(status_code=503, detail="Last.fm not configured")
        
        results = []
        try:
            print(f"\n🔍 Searching for: '{query}'")
            search = self.lastfm.search_for_track('', query)
            matches = search.get_next_page() if hasattr(search, 'get_next_page') else list(search)
            
            for match in matches[:limit]:
                try:
                    song = self.track_to_song(match, skip_youtube=False)
                    results.append(song)
                except Exception as e:
                    print(f"   Error processing match: {e}")
                    continue
            
            print(f"✅ Found {len(results)} results\n")
        except Exception as e:
            print(f"❌ Search error: {e}\n")
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
        
        return {
            "results": results,
            "query": query,
            "total": len(results)
        }
    
    def get_user_history(self, user_id: str, limit: int = 50) -> Dict:
        """Get user listening history"""
        history = self.user_history[user_id][-limit:]
        return {
            "user_id": user_id,
            "total_songs": len(self.user_history[user_id]),
            "history": history
        }

# Global instance
recommendation_engine = RecommendationEngine()