package com.axelor.studio.bpm.service.init;

import org.camunda.bpm.engine.ProcessEngine;

public interface ProcessEngineService {

  void addEngine(String tenantId);

  ProcessEngine getEngine();

  void removeEngine(String tenantId);

  String getWkfViewerUrl();
}
