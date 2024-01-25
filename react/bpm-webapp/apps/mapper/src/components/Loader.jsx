import React from 'react';
import { CircularProgress, Box } from '@axelor/ui';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  loaderView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '999',
  },
});

function Loader() {
  const classes = useStyles();
  return (
    <Box className={classes.loaderView} bgColor="body">
      <CircularProgress size={32} />
    </Box>
  );
}

export default Loader;
