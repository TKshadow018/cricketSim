import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const stageVariant = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const staticStageVariant = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className={`sim-stage-card ${dark ? 'sim-stage-dark' : ''} ${className}`.trim()}
      variants={prefersReducedMotion ? staticStageVariant : stageVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
    >
      <div className="sim-stage-header">
        <div>
          <p className="sim-stage-step">Stage {stageIndex} / {totalStages}</p>
          <h2 className="sim-wave-title sim-wave-title-static">{titleNode || title}</h2>
          <p>{subtitle}</p>
          <div
            className="sim-stage-progress"
            role="progressbar"
            aria-label="Game progress"
            aria-valuemin={1}
            aria-valuemax={totalStages}
            aria-valuenow={stageIndex}
            aria-valuetext={`Stage ${stageIndex} of ${totalStages}`}
          >
            <span style={{ width: `${totalStages > 0 ? (stageIndex / totalStages) * 100 : 0}%` }} />
          </div>
        </div>
        {rightSlot}
      </div>
      <div className="sim-stage-content">{children}</div>
    </motion.section>
  );
}

export default StageShell;
