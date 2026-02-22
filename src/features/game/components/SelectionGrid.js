import React from 'react';
import { motion } from 'framer-motion';

function SelectionGrid({ items, selectedKey, onSelect, renderTitle, renderMeta, renderDescription, keyOf }) {
  return (
    <div className="sim-card-grid">
      {items.map((item, idx) => {
        const key = keyOf(item);
        const active = selectedKey === key;
        const visual = item.renderVisual ? item.renderVisual(item) : null;
        const badge = item.badge || null;

        return (
          <motion.button
            key={key}
            className={`sim-choice-card ${active ? 'active' : ''}`}
            onClick={() => onSelect(item)}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            {visual ? <div className="sim-choice-visual">{visual}</div> : null}
            <h4>{renderTitle(item)}</h4>
            {renderMeta ? <p>{renderMeta(item)}</p> : null}
            {renderDescription ? <small>{renderDescription(item)}</small> : null}
            {badge ? <span className="sim-choice-badge">{badge}</span> : null}
          </motion.button>
        );
      })}
    </div>
  );
}

export default SelectionGrid;
