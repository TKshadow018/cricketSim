import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Wave } from 'react-animated-text';

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
          {titleNode ? (
            <div className="sim-wave-title sim-wave-title-static">{titleNode}</div>
          ) : (
            <div className="sim-wave-title">
              {prefersReducedMotion ? title : <Wave text={title} effect="verticalFadeIn" effectChange={1.1} effectDuration={0.7} />}
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
