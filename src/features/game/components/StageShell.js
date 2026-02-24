import React from 'react';
import { motion } from 'framer-motion';
import { Wave } from 'react-animated-text';

const stageVariant = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

function StageShell({
  stageIndex,
  totalStages,
  title,
  titleNode,
  subtitle,
  className = '',
  rightSlot,
  children,
  dark = false,
}) {
  return (
    <motion.section
      className={`sim-stage-card ${dark ? 'sim-stage-dark' : ''} ${className}`.trim()}
      variants={stageVariant}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="sim-stage-header">
        <div>
          <p className="sim-stage-step">Stage {stageIndex} / {totalStages}</p>
          {titleNode ? (
            <div className="sim-wave-title sim-wave-title-static">{titleNode}</div>
          ) : (
            <div className="sim-wave-title">
              <Wave text={title} effect="verticalFadeIn" effectChange={1.1} effectDuration={0.7} />
            </div>
          )}
          <p>{subtitle}</p>
        </div>
        {rightSlot}
      </div>
      <div className="sim-stage-content">{children}</div>
    </motion.section>
  );
}

export default StageShell;
