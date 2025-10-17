/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import com.axelor.inject.Beans;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.listener.WkfExecutionListener;
import com.axelor.studio.bpm.listener.WkfTaskListener;
import org.camunda.bpm.application.ProcessApplication;
import org.camunda.bpm.application.impl.EmbeddedProcessApplication;
import org.camunda.bpm.engine.delegate.ExecutionListener;
import org.camunda.bpm.engine.delegate.TaskListener;

@ProcessApplication
public class WkfProcessApplication extends EmbeddedProcessApplication {

  public ExecutionListener getExecutionListener() {

    return Beans.get(WkfExecutionListener.class);
  }

  @Override
  public TaskListener getTaskListener() {
    return Beans.get(WkfTaskListener.class);
  }

  @Override
  public String getName() {
    return BpmTools.getCurrentTenant();
  }
}
