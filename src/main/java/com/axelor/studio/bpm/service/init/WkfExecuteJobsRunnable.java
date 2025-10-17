/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import com.axelor.db.JPA;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ServletScopes;
import java.util.Collections;
import java.util.List;
import org.camunda.bpm.engine.impl.ProcessEngineImpl;
import org.camunda.bpm.engine.impl.jobexecutor.ExecuteJobsRunnable;

public class WkfExecuteJobsRunnable extends ExecuteJobsRunnable {

  public WkfExecuteJobsRunnable(List<String> jobIds, ProcessEngineImpl processEngine) {
    super(jobIds, processEngine);
  }

  @Override
  public void run() {
    final RequestScoper scope = ServletScopes.scopeRequest(Collections.emptyMap());
    try (RequestScoper.CloseableScope ignore = scope.open()) {
      try {
        super.run();
      } finally {
        JPA.clear();
      }
    }
  }
}
