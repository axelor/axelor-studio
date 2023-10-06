package com.axelor.studio.bpm.service.log;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;

public interface WkfLoggerInitService {

  void initLogger();

  PatternLayoutEncoder getEncoder();

  LoggerContext getLoggerContext();

  void addAppender(String instanceId, OutputStreamAppender<ILoggingEvent> appender);

  void remove(String instanceId);

  OutputStreamAppender<ILoggingEvent> getAppender(String instanceId);

  void attachAppender(OutputStreamAppender<ILoggingEvent> appender);

  void detachAppender(OutputStreamAppender<ILoggingEvent> appender);
}
