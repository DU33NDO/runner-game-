// Static asset imports
import backgroundUrl from '../assets/background.png?url';
import coneUrl from '../assets/cone.webp?url';
import backgroundConeUrl from '../assets/background_cone.webp?url';
import dollarUrl from '../assets/dollar.png?url';
import bush1Url from '../assets/bush_1.png?url';
import bush2Url from '../assets/bush_2.png?url';
import bush3Url from '../assets/bush_3.png?url';
import tree1Url from '../assets/tree_1.png?url';
import tree2Url from '../assets/tree_2.png?url';
import lampUrl from '../assets/lamp.png?url';
import footerUrl from '../assets/footer.webp?url';
import paypalHeaderUrl from '../assets/paypal_header.webp?url';
import paypalMoneyUrl from '../assets/paypal_money.webp?url';
import cursorUrl from '../assets/cursor.png?url';
import failUrl from '../assets/fail.png?url';
import endBackgroundUrl from '../assets/end_background.png?url';
import aftergameIconUrl from '../assets/aftergame icon.png?url';
import finishUrl from '../assets/finish.png?url';
import heartUrl from '../assets/heart.png?url';
// InstallButton.png available but not imported (using drawn 3D button instead)
import lenta1Url from '../assets/lenta_1.png?url';
import lenta2Url from '../assets/lenta_2.png?url';

// Atlas spritesheets (top-level copies, not inside frame folders)
import playerAtlasUrl from '../assets/player_atlas.png?url';
import enemyAtlasUrl from '../assets/enemy_atlas.png?url';

// Plist raw text
import playerPlistRaw from '../assets/player_atlas.plist?raw';
import enemyPlistRaw from '../assets/enemy_atlas.plist?raw';

export const ASSETS: Record<string, string> = {
  background: backgroundUrl,
  cone: coneUrl,
  backgroundCone: backgroundConeUrl,
  dollar: dollarUrl,
  bush1: bush1Url,
  bush2: bush2Url,
  bush3: bush3Url,
  tree1: tree1Url,
  tree2: tree2Url,
  lamp: lampUrl,
  footer: footerUrl,
  paypalHeader: paypalHeaderUrl,
  paypalMoney: paypalMoneyUrl,
  cursor: cursorUrl,
  fail: failUrl,
  endBackground: endBackgroundUrl,
  aftergameIcon: aftergameIconUrl,
  finish: finishUrl,
  heart: heartUrl,
  lenta1: lenta1Url,
  lenta2: lenta2Url,
  playerAtlas: playerAtlasUrl,
  enemyAtlas: enemyAtlasUrl,
};

export { playerPlistRaw, enemyPlistRaw };
