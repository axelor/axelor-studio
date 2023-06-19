package com.axelor.studio.bpm.service.message;

import org.camunda.bpm.engine.impl.pvm.runtime.PvmExecutionImpl;

public interface BpmErrorMessageService {
  public void sendBpmErrorMessage(PvmExecutionImpl execution, String errorMessage);
}
