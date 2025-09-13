package com.axelor.studio.service;

import com.axelor.message.service.AppSettingsMessageService;

public interface AppSettingsStudioService extends AppSettingsMessageService {

  String appsToInstall();

  boolean importDemoData();

  String applicationLocale();

  String dataExportDir();

  String baseUrl();

  String surveyPublicUser();

  String surveyPublicPassword();

  String getLoggers();

  boolean isAddBpmLog();

  int serializationDepth();

  String[] getPackagesToScan();

  int getMaximumRecursion();

  int processEngineMaxIdleConnections();

  int processEngineMaxActiveConnections();

  boolean isEnabledBpmErrorTracking();

  String getCamundaEngineScriptLogLevel();

  String getCamundaEngineContextLogLevel();
}
