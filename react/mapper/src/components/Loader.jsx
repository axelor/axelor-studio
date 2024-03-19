import React from 'react';
import { CircularProgress, Box } from '@axelor/ui';
import styles from './Loader.module.css';

function Loader() {
  return (
    <Box className={styles.loaderView} bgColor="body">
      <CircularProgress size={32} />
    </Box>
  );
}

export default Loader;
