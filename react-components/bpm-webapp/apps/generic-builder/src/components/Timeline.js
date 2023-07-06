import React from 'react';
import TimelineContent from '@material-ui/lab/TimelineContent';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import Timeline from '@material-ui/lab/Timeline';
import TimelineDot from '@material-ui/lab/TimelineDot';
import TimelineOppositeContent from '@material-ui/lab/TimelineOppositeContent';
import { makeStyles } from '@material-ui/core/styles';
import { translate } from '../utils';

const useStyles = makeStyles(theme => ({
  timeline: {
    height: '100%',
    width: '100%',
    padding: 0,
    margin: 0,
  },
  timelineOppositeContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 0,
    maxWidth: 80,
  },
  timelineItem: {
    minHeight: '100%',
  },
  timelineDot: {
    borderColor: '#0275d8',
  },
  timelineConnector: {
    backgroundColor: '#0275d8',
  },
}));

export default function TimelineComponent({ title, children, isBPMN }) {
  const classes = useStyles();
  return (
    <Timeline
      align="alternate"
      className={classes.timeline}
      style={isBPMN ? { height: `calc(100% - 40px)` } : {}}
    >
      <TimelineItem className={classes.timelineItem}>
        <TimelineOppositeContent className={classes.timelineOppositeContent}>
          {translate(title)}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot variant="outlined" className={classes.timelineDot} />
          <TimelineConnector className={classes.timelineConnector} />
        </TimelineSeparator>
        <TimelineContent>{children}</TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}
