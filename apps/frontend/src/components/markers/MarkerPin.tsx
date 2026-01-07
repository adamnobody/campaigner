import React from 'react';
import { FaMapMarkerAlt, FaRegStar, FaUser, FaLink } from 'react-icons/fa';
import type { MarkerDTO } from '../../app/api';

function getIcon(type: MarkerDTO['marker_type']) {
  switch (type) {
    case 'location': return FaMapMarkerAlt;
    case 'event': return FaRegStar;
    case 'character': return FaUser;
  }
}

export function MarkerPin(props: {
  marker: MarkerDTO;
  showLabel?: boolean;

  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  const { marker, showLabel, onClick, onDoubleClick, onContextMenu } = props;
  const Icon = getIcon(marker.marker_type);

  const hasLink =
    marker.link_type &&
    ((marker.link_type === 'note' && marker.link_note_id) || (marker.link_type === 'map' && marker.link_map_id));

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      title={marker.title}
      style={{
        position: 'absolute',
        left: `${marker.x * 100}%`,
        top: `${marker.y * 100}%`,
        transform: 'translate(-50%, -100%)',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }}
    >
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <Icon
          size={26}
          style={{
            color: marker.color,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))'
          }}
        />

        {hasLink && (
          <span
            style={{
              position: 'absolute',
              right: -6,
              top: -6,
              width: 14,
              height: 14,
              borderRadius: 999,
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Есть ссылка"
          >
            <FaLink size={9} style={{ color: '#444' }} />
          </span>
        )}

        {showLabel && (
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: 28,
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.72)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: 6,
              fontSize: 12,
              whiteSpace: 'nowrap',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none'
            }}
          >
            {marker.title}
          </span>
        )}
      </span>
    </button>
  );
}
