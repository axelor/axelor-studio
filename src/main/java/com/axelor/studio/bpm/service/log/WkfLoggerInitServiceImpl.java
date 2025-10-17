/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.log;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;
import ch.qos.logback.core.spi.ScanException;
import ch.qos.logback.core.util.OptionHelper;
import com.axelor.common.StringUtils;
import com.axelor.common.logging.LoggerConfiguration;
import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.LoggerFactory;

@Singleton
public class WkfLoggerInitServiceImpl implements WkfLoggerInitService {

  private final List<Logger> loggers = new ArrayList<>();

  private PatternLayoutEncoder encoder;

  private LoggerContext context;

  private static final String DEFAULT_LOGGER = "org.camunda.bpm.engine.script";
  private static final String DEFAULT_CONTEXT_LOGGER = "org.camunda.bpm.engine.context";

  private static final String ANSI_LOG_PATTERN =
      "%clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} %clr(%5p) "
          + "%clr(${PID:- }){magenta} %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} "
          + "%clr(:){faint} %m%n";

  private static final Map<String, OutputStreamAppender<ILoggingEvent>> appenderMap =
      new ConcurrentHashMap<>();

  protected AppSettingsStudioService appSettingsStudioService;

  @Inject
  public WkfLoggerInitServiceImpl(AppSettingsStudioService appSettingsStudioService) {
    this.appSettingsStudioService = appSettingsStudioService;
  }

  @Override
  public void initLogger() {
    context = (LoggerContext) LoggerFactory.getILoggerFactory();
    context.putObject(LoggerConfiguration.class.getName(), true);

    addLoggers();

    addEncoder();
  }

  @Override
  public PatternLayoutEncoder getEncoder() {
    return encoder;
  }

  @Override
  public LoggerContext getLoggerContext() {
    return context;
  }

  @Override
  public void addAppender(String instanceId, OutputStreamAppender<ILoggingEvent> appender) {
    appenderMap.put(instanceId, appender);
  }

  @Override
  public void remove(String instanceId) {
    if (appenderMap.containsKey(instanceId)) {
      OutputStreamAppender<ILoggingEvent> appender = appenderMap.get(instanceId);
      detachAppender(appender);
      appender.stop();
      appenderMap.remove(instanceId);
    }
  }

  @Override
  public OutputStreamAppender<ILoggingEvent> getAppender(String instanceId) {
    return appenderMap.get(instanceId);
  }

  @Override
  public void attachAppender(OutputStreamAppender<ILoggingEvent> appender) {

    for (Logger logger : loggers) {
      if (!logger.isAttached(appender)) {
        logger.addAppender(appender);
      }
    }
  }

  @Override
  public void detachAppender(OutputStreamAppender<ILoggingEvent> appender) {

    for (Logger logger : loggers) {
      if (!logger.isAttached(appender)) {
        logger.detachAppender(appender);
      }
    }
  }

  private void addLoggers() {

    Logger logger = context.getLogger(DEFAULT_LOGGER);
    String camundaEngineScriptLogLevel = appSettingsStudioService.getCamundaEngineScriptLogLevel();
    Level defaultLoggerLevel = Level.toLevel(camundaEngineScriptLogLevel);
    logger.setLevel(defaultLoggerLevel);
    loggers.add(logger);

    Logger contextLogger = context.getLogger((DEFAULT_CONTEXT_LOGGER));
    String camundaEngineContextLogLevel =
        appSettingsStudioService.getCamundaEngineContextLogLevel();
    Level defaultContextLoggerLevel = Level.toLevel(camundaEngineContextLogLevel);
    contextLogger.setLevel(defaultContextLoggerLevel);
    loggers.add(contextLogger);

    String loggerNames = appSettingsStudioService.getLoggers();

    if (!StringUtils.isEmpty(loggerNames)) {

      for (String name : loggerNames.split(",")) {
        logger = context.getLogger(name);
        logger.setLevel(Level.DEBUG);
        loggers.add(logger);
      }
    }
  }

  private void addEncoder() {
    try {
      encoder = new PatternLayoutEncoder();
      encoder.setPattern(OptionHelper.substVars(ANSI_LOG_PATTERN, context));
      encoder.setCharset(StandardCharsets.UTF_8);
      encoder.setContext(context);
      encoder.start();
    } catch (ScanException e) {
      throw new IllegalStateException(e);
    }
  }
}
