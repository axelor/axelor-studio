package com.axelor.studio.service;

import com.axelor.message.service.AppSettingsMessageService;

public interface AppSettingsStudioService extends AppSettingsMessageService {

  public String appsToInstall();

  boolean importDemoData();

  String applicationLocale();

  String dataExportDir();

  String baseUrl();

  String surveyPublicUser();

  String surveyPublicPassword();

  String getLoggers();

  public boolean isAddBpmLog();

  int serializationDepth();

  int processEngineMaxIdleConnections();

  int processEngineMaxActiveConnections();

  String[] getPackagesToScan();

  int getMaximumRecursion();
}
