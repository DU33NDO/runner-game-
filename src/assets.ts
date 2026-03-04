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
import finishLineUrl from '../assets/finish_line.png?url';
import heartUrl from '../assets/heart.png?url';
import lenta1Url from '../assets/lenta_1.png?url';
import lenta2Url from '../assets/lenta_2.png?url';
import paypalScoreUrl from '../assets/PaypalScore.png?url';

// Individual player frames (only the ones used in animations)
import p0  from '../assets/player/0.png?url';
import p1  from '../assets/player/1.png?url';
import p2  from '../assets/player/2.png?url';
import p6  from '../assets/player/6.png?url';
import p11 from '../assets/player/11.png?url';
import p13 from '../assets/player/13.png?url';
import p14 from '../assets/player/14.png?url';
import p18 from '../assets/player/18.png?url';
import p19 from '../assets/player/19.png?url';
import p20 from '../assets/player/20.png?url';
import p25 from '../assets/player/25.png?url';
import p26 from '../assets/player/26.png?url';
import p27 from '../assets/player/27.png?url';
import p28 from '../assets/player/28.png?url';
import p36 from '../assets/player/36.png?url';
import p37 from '../assets/player/37.png?url';

// Enemy atlas (still atlas-based)
import enemyAtlasUrl from '../assets/enemy_atlas.png?url';
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
  finishLine: finishLineUrl,
  heart: heartUrl,
  lenta1: lenta1Url,
  lenta2: lenta2Url,
  paypalScore: paypalScoreUrl,
  // Player individual frames
  player_0:  p0,
  player_1:  p1,
  player_2:  p2,
  player_6:  p6,
  player_11: p11,
  player_13: p13,
  player_14: p14,
  player_18: p18,
  player_19: p19,
  player_20: p20,
  player_25: p25,
  player_26: p26,
  player_27: p27,
  player_28: p28,
  player_36: p36,
  player_37: p37,
  // Enemy atlas
  enemyAtlas: enemyAtlasUrl,
};

export { enemyPlistRaw };
