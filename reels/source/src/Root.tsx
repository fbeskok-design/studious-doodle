import React from 'react';
import {Composition} from 'remotion';
import {Reel, VARIANTS, DURATION} from './Reel';

export const RemotionRoot: React.FC = () => (
  <>
    {VARIANTS.map((v) => (
      <Composition key={v.id} id={v.id} component={Reel} durationInFrames={DURATION}
        fps={30} width={1080} height={1920} defaultProps={{variant: v}} />
    ))}
  </>
);
