package com.axelor.studio.service;

import com.axelor.app.AppSettings;
import com.axelor.common.StringUtils;
import com.axelor.message.service.AppSettingsMessageServiceImpl;
import com.google.inject.Singleton;
import javax.annotation.concurrent.ThreadSafe;

@Singleton
@ThreadSafe
public class AppSettingsStudioServiceImpl extends AppSettingsMessageServiceImpl
    implements AppSettingsStudioService {

  @Override
  public String appsToInstall() {
    String appsToInstall = appSettings.get("studio.apps.install");
    if (StringUtils.isBlank(appsToInstall)) {
      appsToInstall = appSettings.get("aos.apps.install-apps");
    }
    return appsToInstall;
  }

  @Override
  public boolean importDemoData() {
    return appSettings.getBoolean("data.import.demo-data", false);
  }

  @Override
  public String applicationLocale() {
    return appSettings.get("application.locale", "en");
  }

  @Override
  public String dataExportDir() {
    return appSettings.get("data.export.dir");
  }

  @Override
  public String baseUrl() {
    return AppSettings.get().getBaseURL();
  }

  @Override
  public String surveyPublicUser() {
    return appSettings.get("survey.public.user");
  }

  @Override
  public String surveyPublicPassword() {
    return appSettings.get("survey.public.password");
  }

  @Override
  public String getLoggers() {
    return appSettings.get("bpm.loggers");
  }

  @Override
  public boolean isAddBpmLog() {
    return appSettings.getBoolean("studio.bpm.logging", false);
  }

  @Override
  public int serializationDepth() {
    return appSettings.getInt("studio.bpm.serialization.depth", 5);
  }

  @Override
  public int processEngineMaxIdleConnections() {
    return appSettings.getInt("studio.bpm.max.idle.connections", 10);
  }

  @Override
  public int processEngineMaxActiveConnections() {
    return appSettings.getInt("studio.bpm.max.active.connections", 50);
  }

  @Override
  public boolean isEnabledBpmErrorTracking() {
    return appSettings.getBoolean("studio.bpm.enable.bpm.error.tracking", false);
  }

  @Override
  public String getCamundaEngineScriptLogLevel() {
    return getLoggerLogLevel("org.camunda.bpm.engine.script");
  }

  @Override
  public String getCamundaEngineContextLogLevel() {
    return getLoggerLogLevel("org.camunda.bpm.engine.context");
  }

  private String getLoggerLogLevel(String loggerPrefix) {
    String[] logLevels = {
      "logging.level." + loggerPrefix,
      "logging.level." + loggerPrefix.replaceFirst("\\.[^.]+$", ""),
      "logging.level." + loggerPrefix.replaceFirst("\\.[^.]+\\.[^.]+$", ""),
      "logging.level." + loggerPrefix.replaceFirst("\\.[^.]+\\.[^.]+\\.[^.]+$", ""),
      "logging.level.root"
    };

    for (String logLevel : logLevels) {
      String value = appSettings.get(logLevel);
      if (value != null) {
        return value;
      }
    }

    return "ERROR";
  }

  @Override
  public String[] getPackagesToScan() {
    var packages = appSettings.get("studio.link.script.packages.to.scan");
    return StringUtils.isBlank(packages) ? new String[0] : packages.split(",");
  }

  @Override
  public int getMaximumRecursion() {
    return appSettings.getInt("studio.link.script.maximum.recursion", 100);
  }
}
