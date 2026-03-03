import * as PIXI from 'pixi.js';

interface PlistFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Parse a TexturePacker plist into PixiJS Spritesheet data */
export function parsePlist(plistXml: string): Record<string, PlistFrame> {
  const frames: Record<string, PlistFrame> = {};
  const frameRegex = /<key>(\d+\.png)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let match;
  while ((match = frameRegex.exec(plistXml)) !== null) {
    const name = match[1];
    const block = match[2];
    const rectMatch = block.match(
      /<key>textureRect<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}/
    );
    if (rectMatch) {
      frames[name] = {
        x: parseInt(rectMatch[1]),
        y: parseInt(rectMatch[2]),
        w: parseInt(rectMatch[3]),
        h: parseInt(rectMatch[4]),
      };
    }
  }
  return frames;
}

/** Create a PixiJS Spritesheet from a plist and loaded base texture */
export async function createSpritesheetFromPlist(
  baseTexture: PIXI.BaseTexture,
  plistXml: string,
  prefix: string
): Promise<PIXI.Spritesheet> {
  const plistFrames = parsePlist(plistXml);

  const spritesheetData: PIXI.ISpritesheetData = {
    frames: {},
    meta: {
      scale: '1',
    },
  };

  for (const [name, f] of Object.entries(plistFrames)) {
    const idx = name.replace('.png', '');
    spritesheetData.frames[`${prefix}_${idx}`] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
    };
  }

  const sheet = new PIXI.Spritesheet(baseTexture, spritesheetData);
  await sheet.parse();
  return sheet;
}

/** Get animation textures from a spritesheet by frame indices */
export function getAnimFrames(
  sheet: PIXI.Spritesheet,
  prefix: string,
  indices: number[]
): PIXI.Texture[] {
  return indices
    .map((i) => sheet.textures[`${prefix}_${i}`])
    .filter(Boolean);
}
