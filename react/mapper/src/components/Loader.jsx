import React from 'react';
import { CircularProgress, Box } from '@axelor/ui';
import styles from './loader.module.css';

function Loader() {
  return (
    <Box className={styles.loaderView} bgColor="body">
      <CircularProgress size={32} />
    </Box>
  );
}

export default Loader;
