import React from 'react';
import { Composition, continueRender, delayRender, staticFile } from 'remotion';
import { Main } from './Main';
import { TOTAL, FPS } from './timeline';

// Bai Jamjuree — the crazyrc.in typeface — must be loaded before any frame renders
const fontHandle = delayRender('fonts');
Promise.all([['700', 'Bold'], ['600', 'SemiBold'], ['500', 'Medium']].map(([w, n]) => {
  const ff = new FontFace('Bai Jamjuree', `url(${staticFile(`fonts/BaiJamjuree-${n}.ttf`)})`, { weight: w });
  return ff.load().then(l => document.fonts.add(l));
})).then(() => continueRender(fontHandle));

export const Root: React.FC = () => (
  <Composition id="C8801" component={Main} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);
