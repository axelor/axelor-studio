package com.axelor.studio.bpm.service.init;

import org.camunda.bpm.engine.ProcessEngine;

public interface ProcessEngineService {

  public void addEngine(String tenantId);

  public ProcessEngine getEngine();

  public void removeEngine(String tenantId);

  public String getWkfViewerUrl();
}
