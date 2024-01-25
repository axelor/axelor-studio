import React from 'react';
import { translate } from '../utils';
import { Box } from '@axelor/ui';

const styles = {
  timelineDot: {
    padding: 4,
    border: '2px solid',
    borderRadius: '50%',
    borderColor: 'var(--bs-blue)',
  },
  timelineConnector: {
    width: 2,
    background: 'var(--bs-blue)',
  },
  timelineContent: {
    padding: '6px 16px',
  },
};

export default function TimelineComponent({ title, children }) {
  return (
    <Box d="flex" flexDirection="column">
      <Box d="flex">
        <Box
          d="flex"
          flex="1"
          alignItems="center"
          justifyContent="flex-end"
          p={0}
          style={{ maxWidth: 80 }}
        >
          {translate(title)}
        </Box>
        <Box d="flex" alignItems="center" flexDirection="column" gap={8}>
          <Box style={styles.timelineDot} />
          <Box flexGrow="1" style={styles.timelineConnector} />
        </Box>
        <Box flex="1" style={styles.timelineContent}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
