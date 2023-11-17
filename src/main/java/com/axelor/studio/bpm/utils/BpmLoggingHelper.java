package com.axelor.studio.bpm.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BpmLoggingHelper {

  private BpmLoggingHelper() {}

  private static final Logger LOGGER = LoggerFactory.getLogger("org.camunda.bpm.engine.script");

  public static Logger get() {
    return LOGGER;
  }

}
