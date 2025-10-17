/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import com.axelor.inject.Beans;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.script.AxelorScriptEngineFactory;
import java.util.Arrays;
import org.camunda.bpm.application.impl.event.ProcessApplicationEventListenerPlugin;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.camunda.spin.plugin.impl.SpinProcessEnginePlugin;

public class WkfProcessEngineConfigurationImpl extends StandaloneProcessEngineConfiguration {

  @Override
  protected void invokePreInit() {
    processEnginePlugins.add(new SpinProcessEnginePlugin());
    processEnginePlugins.add(new ProcessApplicationEventListenerPlugin());
    super.invokePreInit();
  }

  @Override
  public void init() {
    super.init();
  }

  @Override
  protected void initScripting() {
    super.initScripting();
    AxelorScriptEngineFactory factory = new AxelorScriptEngineFactory();
    scriptingEngines.getScriptEngineManager().registerEngineName("axelor", factory);
    scriptingEngines.addScriptEngineFactory(factory);
  }

  @Override
  protected void initBeans() {
    super.initBeans();
    beans.put("__ctx__", Beans.get(WkfContextHelper.class));
  }

  @Override
  protected void initExpressionManager() {
    super.initExpressionManager();
    Arrays.stream(WkfContextHelper.class.getDeclaredMethods())
        .forEach(m -> expressionManager.addFunction(m.getName(), m));
  }
}
