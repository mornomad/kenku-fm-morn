import { useCallback, useEffect, useRef } from "react";

import { useDispatch } from "react-redux";
import {
  playSound,
  updatePlayback,
  stopSound,
} from "./soundboardPlaybackSlice";
import { Sound as SoundType } from "./soundboardsSlice";
import { Sound } from "./Sound";

export function useSoundboardPlayback(onError: (message: string) => void) {
  const soundsRef = useRef<Record<string, Sound>>({});
  const dispatch = useDispatch();

  const play = useCallback(
    (sound: SoundType) => {
      if (soundsRef.current[sound.id]) {
        soundsRef.current[sound.id].stop(false);
        delete soundsRef.current[sound.id];
      }

      const playback = new Sound({
        src: sound.url,
        volume: sound.volume,
        fadeIn: sound.fadeIn,
        fadeOut: sound.fadeOut,
        loop: sound.loop,
      });

      playback.once("load", (duration) => {
        dispatch(
          playSound({
            sound,
            duration: Math.floor(duration),
          })
        );
      });

      playback.on("end", () => {
        dispatch(stopSound(sound.id));
        soundsRef.current[sound.id]?.stop(false);
        delete soundsRef.current[sound.id];
      });

      playback.on("error", () => {
        delete soundsRef.current[sound.id];
        dispatch(stopSound(sound.id));
        onError(`Unable to play sound: ${sound.title}`);
      });

      soundsRef.current[sound.id] = playback;
    },
    [onError]
  );

  useEffect(() => {
    // Drive the once-a-second progress updates with an interval. (This used
    // to be a requestAnimationFrame loop that woke up ~60 times a second
    // only to check whether a second had passed.)
    const interval = window.setInterval(() => {
      const updates: { id: string; progress: number }[] = [];
      for (let id in soundsRef.current) {
        const sound = soundsRef.current[id];
        if (sound.playing()) {
          updates.push({ id, progress: sound.progress() });
        }
      }
      if (updates.length > 0) {
        dispatch(updatePlayback(updates));
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const seek = useCallback((id: string, to: number) => {
    dispatch(updatePlayback([{ id, progress: to }]));
    soundsRef.current[id]?.seek(to);
  }, []);

  const stop = useCallback(async (id: string) => {
    dispatch(stopSound(id));
    const loop = soundsRef.current[id];
    if (loop) {
      await loop.stop(true);
      delete soundsRef.current[id];
    }
  }, []);

  // Sync function for updating the currently playing sounds with the redux store
  // Used in `SoundboardPlaybackSync`
  const sync = useCallback((update: (id: string, sound: Sound) => void) => {
    for (let [id, sound] of Object.entries(soundsRef.current)) {
      update(id, sound);
    }
  }, []);

  return {
    seek,
    play,
    stop,
    sync,
  };
}
