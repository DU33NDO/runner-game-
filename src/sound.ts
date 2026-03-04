import bgMusicUrl  from '../assets/music/background_music.mp3?url';
import jumpUrl      from '../assets/music/jump.mp3?url';
import collectUrl   from '../assets/music/collecting.mp3?url';
import damageUrl    from '../assets/music/damage.mp3?url';
import winUrl       from '../assets/music/win.mp3?url';
import loseUrl      from '../assets/music/lose.mp3?url';

const bgMusic = new Audio(bgMusicUrl);
bgMusic.loop = true;
bgMusic.volume = 0.35;

let muted = false;

export function setMuted(val: boolean) {
  muted = val;
  bgMusic.muted = val;
}

function sfx(url: string, volume = 1) {
  if (muted) return;
  const a = new Audio(url);
  a.volume = volume;
  a.play().catch(() => {});
}

export function startBgMusic() { bgMusic.play().catch(() => {}); }
export function stopBgMusic()  { bgMusic.pause(); bgMusic.currentTime = 0; }

export const playJump    = () => sfx(jumpUrl,    0.7);
export const playCollect = () => sfx(collectUrl, 0.8);
export const playDamage  = () => sfx(damageUrl,  1.0);
export const playWin     = () => { stopBgMusic(); sfx(winUrl,  1.0); };
export const playLose    = () => { stopBgMusic(); sfx(loseUrl, 1.0); };
