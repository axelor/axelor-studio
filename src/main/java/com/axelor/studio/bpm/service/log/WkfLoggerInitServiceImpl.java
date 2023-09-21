/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.service.log;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;
import ch.qos.logback.core.util.OptionHelper;
import com.axelor.common.StringUtils;
import com.axelor.common.logging.LoggerConfiguration;
import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.LoggerFactory;

@Singleton
public class WkfLoggerInitServiceImpl {

  private List<Logger> loggers = new ArrayList<Logger>();

  private PatternLayoutEncoder encoder;

  private LoggerContext context;

  private static final String DEFAULT_LOGGER = "org.camunda.bpm.engine.script";

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

  public void initLogger() {
    context = (LoggerContext) LoggerFactory.getILoggerFactory();
    context.putObject(LoggerConfiguration.class.getName(), true);

    addLoggers();

    addEncoder();
  }

  public PatternLayoutEncoder getEncoder() {
    return encoder;
  }

  public LoggerContext getLoggerContext() {
    return context;
  }

  public void addAppender(String instanceId, OutputStreamAppender<ILoggingEvent> appender) {
    appenderMap.put(instanceId, appender);
  }

  public void remove(String instanceId) {
    if (appenderMap.containsKey(instanceId)) {
      OutputStreamAppender<ILoggingEvent> appender = appenderMap.get(instanceId);
      detachAppender(appender);
      appender.stop();
      appenderMap.remove(instanceId);
    }
  }

  public OutputStreamAppender<ILoggingEvent> getAppender(String instanceId) {
    return appenderMap.get(instanceId);
  }

  public void attachAppender(OutputStreamAppender<ILoggingEvent> appender) {

    for (Logger logger : loggers) {
      if (!logger.isAttached(appender)) {
        logger.addAppender(appender);
      }
    }
  }

  public void detachAppender(OutputStreamAppender<ILoggingEvent> appender) {

    for (Logger logger : loggers) {
      if (!logger.isAttached(appender)) {
        logger.detachAppender(appender);
      }
    }
  }

  private void addLoggers() {

    Logger logger = context.getLogger(DEFAULT_LOGGER);
    logger.setLevel(Level.DEBUG);
    loggers.add(logger);

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
    encoder = new PatternLayoutEncoder();
    encoder.setPattern(OptionHelper.substVars(ANSI_LOG_PATTERN, context));
    encoder.setCharset(Charset.forName("UTF-8"));
    encoder.setContext(context);
    encoder.start();
  }
}
