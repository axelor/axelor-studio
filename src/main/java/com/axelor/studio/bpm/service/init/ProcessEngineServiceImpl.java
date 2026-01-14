/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.service.init;

import com.axelor.db.tenants.TenantConfig;
import com.axelor.db.tenants.TenantConfigProvider;
import com.axelor.db.tenants.TenantConnectionProvider;
import com.axelor.db.tenants.TenantModule;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.utils.BpmTools;
import com.axelor.studio.bpm.context.WkfCache;
import com.axelor.studio.bpm.service.log.WkfLoggerInitService;
import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngineConfiguration;
import org.camunda.bpm.engine.ProcessEngines;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.variable.Variables;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class ProcessEngineServiceImpl implements ProcessEngineService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected static final Map<String, ProcessEngine> engineMap = new ConcurrentHashMap<>();

  protected final WkfLoggerInitService wkfLoggerInitService;
  protected final AppSettingsStudioService appSettingsStudioService;

  @Inject
  public ProcessEngineServiceImpl(
      WkfLoggerInitService wkfLoggerInitService,
      TenantConnectionProvider tenantConnectionProvider,
      AppSettingsStudioService appSettingsStudioService) {
    this.wkfLoggerInitService = wkfLoggerInitService;
    this.appSettingsStudioService = appSettingsStudioService;
    // Initialization moved to initialize() method - called by ServerStartListener if BPM app is
    // active
  }

  @Override
  public void initialize() {
    String tenantId = BpmTools.getCurentTenant();
    if (engineMap.containsKey(tenantId)) {
      log.debug("Process engine already initialized for tenant: {}", tenantId);
      return;
    }
    log.info("Initializing BPM process engine for tenant: {}", tenantId);
    addEngine(tenantId);
    WkfCache.initWkfModelCache();
    WkfCache.initWkfButttonCache();
  }

  @Override
  public boolean isInitialized() {
    return engineMap.containsKey(BpmTools.getCurentTenant());
  }

  @Override
  public void shutdown() {
    log.info("Shutting down all BPM process engines...");
    new java.util.ArrayList<>(engineMap.keySet()).forEach(this::removeEngine);
    log.info("All BPM process engines shut down successfully");
  }

  @Override
  public void addEngine(String tenantId) {

    TenantConfig tenantConfig = Beans.get(TenantConfigProvider.class).find(tenantId);
    log.debug(
        "Adding engine for the tenant: {}, tenantConfig exist: {}", tenantId, tenantConfig != null);

    if (tenantConfig == null) {
      return;
    }

    boolean multiTenant = TenantModule.isEnabled();

    if (!multiTenant) {
      wkfLoggerInitService.initLogger();
    }

    ProcessEngineConfigurationImpl configImpl = Beans.get(WkfProcessEngineConfigurationImpl.class);

    ProcessEngine engine =
        configImpl
            .setJdbcDriver(tenantConfig.getJdbcDriver())
            .setJdbcUrl(tenantConfig.getJdbcUrl())
            .setJdbcUsername(tenantConfig.getJdbcUser())
            .setJdbcPassword(tenantConfig.getJdbcPassword())
            .setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE)
            .setHistory(ProcessEngineConfiguration.HISTORY_AUDIT)
            .setJdbcMaxIdleConnections(appSettingsStudioService.processEngineMaxIdleConnections())
            .setJdbcMaxActiveConnections(
                appSettingsStudioService.processEngineMaxActiveConnections())
            .setJobExecutorActivate(!multiTenant)
            .setMetricsEnabled(false)
            .setJobExecutor(Beans.get(WkfJobExecutor.class))
            .setDefaultSerializationFormat(Variables.SerializationDataFormats.JAVA.name())
            .setJobExecutorDeploymentAware(true)
            .setJdbcBatchProcessing(true)
            .buildProcessEngine();

    engine
        .getRepositoryService()
        .createDeploymentQuery()
        .list()
        .forEach(
            deployment -> {
              engine
                  .getManagementService()
                  .registerProcessApplication(
                      deployment.getId(), Beans.get(WkfProcessApplication.class).getReference());

              engine.getManagementService().registerDeploymentForJobExecutor(deployment.getId());
            });
    ((WkfProcessEngineConfigurationImpl) engine.getProcessEngineConfiguration())
        .setTelemetryReporterActivate(false);
    engineMap.put(tenantId, engine);
  }

  @Override
  public ProcessEngine getEngine() {
    String tenantId = BpmTools.getCurentTenant();
    ProcessEngine engine = engineMap.get(tenantId);
    if (engine == null) {
      throw new IllegalStateException(
          "BPM Process Engine is not initialized. Ensure the BPM app is installed and active.");
    }
    return engine;
  }

  @Override
  public void removeEngine(String tenantId) {
    ProcessEngine engine = engineMap.get(tenantId);
    if (engine != null) {
      ProcessEngines.unregister(engine);
      engine.close();
    }
    engineMap.remove(tenantId);
    WkfCache.WKF_BUTTON_CACHE.remove(tenantId);
    WkfCache.WKF_MODEL_CACHE.remove(tenantId);
  }

  @Override
  public String getWkfViewerUrl() {
    return "bpm/?%s&taskIds=%s&activityCount=%s&node=%s";
  }
}
