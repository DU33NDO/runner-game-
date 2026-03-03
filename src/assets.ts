// Asset imports - Vite will inline these as base64 for the single-file build
import backgroundUrl from '../assets/background.png?url';
import spriteActionsUrl from '../assets/sprite_actions.png?url';
import enemyActionsUrl from '../assets/enemy_actions.png?url';
import coneUrl from '../assets/cone.webp?url';
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
import finishLineUrl from '../assets/finish_line.png?url';
import stickUrl from '../assets/stick for finish.png?url';
import lenta1Url from '../assets/lenta_1.png?url';
import lenta2Url from '../assets/lenta_2.png?url';
import backgroundConeUrl from '../assets/background_cone.webp?url';
import animationPaypalUrl from '../assets/animation_paypal.png?url';

export const ASSETS = {
  background: backgroundUrl,
  spriteActions: spriteActionsUrl,
  enemyActions: enemyActionsUrl,
  cone: coneUrl,
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
  finishLine: finishLineUrl,
  stick: stickUrl,
  lenta1: lenta1Url,
  lenta2: lenta2Url,
  backgroundCone: backgroundConeUrl,
  animationPaypal: animationPaypalUrl,
} as const;
