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
package com.axelor.studio.module;

import com.axelor.app.AppSettings;
import com.axelor.app.AxelorModule;
import com.axelor.message.service.AppSettingsMessageServiceImpl;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.service.ViewProcessor;
import com.axelor.studio.app.listener.AppServerStartListener;
import com.axelor.studio.app.service.AccessTemplateService;
import com.axelor.studio.app.service.AccessTemplateServiceImpl;
import com.axelor.studio.app.service.AppService;
import com.axelor.studio.app.service.AppServiceImpl;
import com.axelor.studio.app.service.AppVersionService;
import com.axelor.studio.app.service.AppVersionServiceImpl;
import com.axelor.studio.baml.service.BamlService;
import com.axelor.studio.baml.service.BamlServiceImpl;
import com.axelor.studio.bpm.listener.ServerStartListener;
import com.axelor.studio.bpm.listener.WkfModelImportListener;
import com.axelor.studio.bpm.listener.WkfRequestListener;
import com.axelor.studio.bpm.mapper.BpmMapperScriptGeneratorServiceImpl;
import com.axelor.studio.bpm.service.AppLoaderExportBpmServiceImpl;
import com.axelor.studio.bpm.service.AppLoaderImportBpmServiceImpl;
import com.axelor.studio.bpm.service.ProcessInstanceModificationService;
import com.axelor.studio.bpm.service.ProcessInstanceModificationServiceImpl;
import com.axelor.studio.bpm.service.WkfBpmImportService;
import com.axelor.studio.bpm.service.WkfBpmImportServiceImpl;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.WkfCommonServiceImpl;
import com.axelor.studio.bpm.service.WkfDisplayService;
import com.axelor.studio.bpm.service.WkfDisplayServiceImpl;
import com.axelor.studio.bpm.service.WkfModelMergerSplitterService;
import com.axelor.studio.bpm.service.WkfModelMergerSplitterServiceImpl;
import com.axelor.studio.bpm.service.WkfModelService;
import com.axelor.studio.bpm.service.WkfModelServiceImpl;
import com.axelor.studio.bpm.service.app.AppBpmService;
import com.axelor.studio.bpm.service.app.AppBpmServiceImpl;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardService;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardServiceImpl;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardTaskService;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardTaskServiceImpl;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardUserService;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardUserServiceImpl;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardCommonService;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardCommonServiceImpl;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardService;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardServiceImpl;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentService;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentServiceImpl;
import com.axelor.studio.bpm.service.deployment.MetaAttrsService;
import com.axelor.studio.bpm.service.deployment.MetaAttrsServiceImpl;
import com.axelor.studio.bpm.service.deployment.WkfMenuService;
import com.axelor.studio.bpm.service.deployment.WkfMenuServiceImpl;
import com.axelor.studio.bpm.service.deployment.WkfNodeService;
import com.axelor.studio.bpm.service.deployment.WkfNodeServiceImpl;
import com.axelor.studio.bpm.service.execution.WkfEmailService;
import com.axelor.studio.bpm.service.execution.WkfEmailServiceImpl;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.studio.bpm.service.execution.WkfTaskService;
import com.axelor.studio.bpm.service.execution.WkfTaskServiceImpl;
import com.axelor.studio.bpm.service.execution.WkfUserActionService;
import com.axelor.studio.bpm.service.execution.WkfUserActionServiceImpl;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.service.init.ProcessEngineServiceImpl;
import com.axelor.studio.bpm.service.init.WkfProcessApplication;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.bpm.service.log.WkfLogServiceImpl;
import com.axelor.studio.bpm.service.log.WkfLoggerInitService;
import com.axelor.studio.bpm.service.log.WkfLoggerInitServiceImpl;
import com.axelor.studio.bpm.service.message.BpmErrorMessageService;
import com.axelor.studio.bpm.service.message.BpmErrorMessageServiceImpl;
import com.axelor.studio.bpm.service.migration.WkfMigrationService;
import com.axelor.studio.bpm.service.migration.WkfMigrationServiceImpl;
import com.axelor.studio.db.repo.BpmWkfDmnModelRepository;
import com.axelor.studio.db.repo.BpmWkfInstanceRepository;
import com.axelor.studio.db.repo.BpmWkfModelRepository;
import com.axelor.studio.db.repo.MetaJsonFieldRepo;
import com.axelor.studio.db.repo.MetaJsonModelRepo;
import com.axelor.studio.db.repo.StudioActionRepo;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.db.repo.StudioAppRepo;
import com.axelor.studio.db.repo.StudioAppRepository;
import com.axelor.studio.db.repo.StudioChartRepo;
import com.axelor.studio.db.repo.StudioChartRepository;
import com.axelor.studio.db.repo.StudioDashboardRepo;
import com.axelor.studio.db.repo.StudioDashboardRepository;
import com.axelor.studio.db.repo.StudioMenuRepo;
import com.axelor.studio.db.repo.StudioMenuRepository;
import com.axelor.studio.db.repo.StudioSelectionRepo;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WsAuthenticatorRepo;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.db.repo.WsConnectorRepo;
import com.axelor.studio.db.repo.WsConnectorRepository;
import com.axelor.studio.dmn.service.DmnDeploymentService;
import com.axelor.studio.dmn.service.DmnDeploymentServiceImpl;
import com.axelor.studio.dmn.service.DmnExportService;
import com.axelor.studio.dmn.service.DmnExportServiceImpl;
import com.axelor.studio.dmn.service.DmnImportService;
import com.axelor.studio.dmn.service.DmnImportServiceImpl;
import com.axelor.studio.dmn.service.DmnService;
import com.axelor.studio.dmn.service.DmnServiceImpl;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.studio.service.AppSettingsStudioServiceImpl;
import com.axelor.studio.service.ChartRecordViewService;
import com.axelor.studio.service.ChartRecordViewServiceImpl;
import com.axelor.studio.service.ExportService;
import com.axelor.studio.service.ExportServiceImpl;
import com.axelor.studio.service.JsonFieldService;
import com.axelor.studio.service.JsonFieldServiceImpl;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.StudioMetaServiceImpl;
import com.axelor.studio.service.ViewProcessorImpl;
import com.axelor.studio.service.app.AppStudioService;
import com.axelor.studio.service.app.AppStudioServiceImpl;
import com.axelor.studio.service.builder.ReportBuilderService;
import com.axelor.studio.service.builder.ReportBuilderServiceImpl;
import com.axelor.studio.service.builder.StudioActionEmailService;
import com.axelor.studio.service.builder.StudioActionEmailServiceImpl;
import com.axelor.studio.service.builder.StudioActionScriptService;
import com.axelor.studio.service.builder.StudioActionScriptServiceImpl;
import com.axelor.studio.service.builder.StudioActionService;
import com.axelor.studio.service.builder.StudioActionServiceImpl;
import com.axelor.studio.service.builder.StudioActionViewService;
import com.axelor.studio.service.builder.StudioActionViewServiceImpl;
import com.axelor.studio.service.builder.StudioAppService;
import com.axelor.studio.service.builder.StudioAppServiceImpl;
import com.axelor.studio.service.builder.StudioChartService;
import com.axelor.studio.service.builder.StudioChartServiceImpl;
import com.axelor.studio.service.builder.StudioDashboardService;
import com.axelor.studio.service.builder.StudioDashboardServiceImpl;
import com.axelor.studio.service.builder.StudioMenuService;
import com.axelor.studio.service.builder.StudioMenuServiceImpl;
import com.axelor.studio.service.builder.StudioSelectionService;
import com.axelor.studio.service.builder.StudioSelectionServiceImpl;
import com.axelor.studio.service.filter.FilterCommonService;
import com.axelor.studio.service.filter.FilterCommonServiceImpl;
import com.axelor.studio.service.filter.FilterGroovyService;
import com.axelor.studio.service.filter.FilterGroovyServiceImpl;
import com.axelor.studio.service.filter.FilterJpqlService;
import com.axelor.studio.service.filter.FilterJpqlServiceImpl;
import com.axelor.studio.service.filter.FilterSqlService;
import com.axelor.studio.service.filter.FilterSqlServiceImpl;
import com.axelor.studio.service.loader.AppLoaderExportService;
import com.axelor.studio.service.loader.AppLoaderExportServiceImpl;
import com.axelor.studio.service.loader.AppLoaderImportService;
import com.axelor.studio.service.loader.AppLoaderImportServiceImpl;
import com.axelor.studio.service.mapper.MapperScriptGeneratorService;
import com.axelor.studio.service.mapper.MapperScriptGeneratorServiceImpl;
import com.axelor.studio.service.transformation.TransformationService;
import com.axelor.studio.service.transformation.TransformationServiceImpl;
import com.axelor.studio.service.ws.WsAuthenticatorService;
import com.axelor.studio.service.ws.WsAuthenticatorServiceImpl;
import com.axelor.studio.service.ws.WsConnectorService;
import com.axelor.studio.service.ws.WsConnectorServiceImpl;

public class StudioModule extends AxelorModule {

  @Override
  protected void configure() {
    AppSettings.get().enableFeature("studio");
    bind(ViewProcessor.class).to(ViewProcessorImpl.class);
    bind(StudioChartRepository.class).to(StudioChartRepo.class);
    bind(StudioActionRepository.class).to(StudioActionRepo.class);
    bind(StudioMenuRepository.class).to(StudioMenuRepo.class);
    bind(StudioDashboardRepository.class).to(StudioDashboardRepo.class);
    bind(StudioAppRepository.class).to(StudioAppRepo.class);
    bind(MetaJsonFieldRepository.class).to(MetaJsonFieldRepo.class);
    bind(MetaJsonModelRepository.class).to(MetaJsonModelRepo.class);
    bind(StudioSelectionRepository.class).to(StudioSelectionRepo.class);
    bind(AppStudioService.class).to(AppStudioServiceImpl.class);
    bind(MapperScriptGeneratorService.class).to(MapperScriptGeneratorServiceImpl.class);
    bind(AppLoaderImportService.class).to(AppLoaderImportServiceImpl.class);
    bind(AppLoaderExportService.class).to(AppLoaderExportServiceImpl.class);
    bind(ChartRecordViewService.class).to(ChartRecordViewServiceImpl.class);
    bind(AppSettingsStudioService.class).to(AppSettingsStudioServiceImpl.class);
    bind(AppSettingsMessageServiceImpl.class).to(AppSettingsStudioServiceImpl.class);
    bind(ExportService.class).to(ExportServiceImpl.class);

    bind(WsConnectorService.class).to(WsConnectorServiceImpl.class);
    bind(WsAuthenticatorService.class).to(WsAuthenticatorServiceImpl.class);
    bind(WsConnectorRepository.class).to(WsConnectorRepo.class);
    bind(WsAuthenticatorRepository.class).to(WsAuthenticatorRepo.class);
    bind(TransformationService.class).to(TransformationServiceImpl.class);

    // App
    bind(AppService.class).to(AppServiceImpl.class);
    bind(AccessTemplateService.class).to(AccessTemplateServiceImpl.class);
    bind(AppServerStartListener.class);
    bind(AppVersionService.class).to(AppVersionServiceImpl.class);

    // BPM
    bind(WkfRequestListener.class);
    bind(WkfProcessApplication.class);
    bind(WkfInstanceRepository.class).to(BpmWkfInstanceRepository.class);
    bind(WkfModelRepository.class).to(BpmWkfModelRepository.class);
    bind(WkfDmnModelRepository.class).to(BpmWkfDmnModelRepository.class);
    bind(AppBpmService.class).to(AppBpmServiceImpl.class);
    bind(WkfCommonService.class).to(WkfCommonServiceImpl.class);
    bind(WkfDisplayService.class).to(WkfDisplayServiceImpl.class);
    bind(WkfModelService.class).to(WkfModelServiceImpl.class);
    bind(BpmDeploymentService.class).to(BpmDeploymentServiceImpl.class);
    bind(MetaAttrsService.class).to(MetaAttrsServiceImpl.class);
    bind(WkfEmailService.class).to(WkfEmailServiceImpl.class);
    bind(WkfInstanceService.class).to(WkfInstanceServiceImpl.class);
    bind(WkfTaskService.class).to(WkfTaskServiceImpl.class);
    bind(WkfUserActionService.class).to(WkfUserActionServiceImpl.class);
    bind(DmnDeploymentService.class).to(DmnDeploymentServiceImpl.class);
    bind(DmnService.class).to(DmnServiceImpl.class);
    bind(BamlService.class).to(BamlServiceImpl.class);
    bind(DmnExportService.class).to(DmnExportServiceImpl.class);
    bind(DmnImportService.class).to(DmnImportServiceImpl.class);

    bind(MapperScriptGeneratorServiceImpl.class).to(BpmMapperScriptGeneratorServiceImpl.class);
    bind(AppLoaderExportServiceImpl.class).to(AppLoaderExportBpmServiceImpl.class);
    bind(WkfDashboardService.class).to(WkfDashboardServiceImpl.class);
    bind(WkfDashboardCommonService.class).to(WkfDashboardCommonServiceImpl.class);
    bind(BpmManagerDashboardService.class).to(BpmManagerDashboardServiceImpl.class);
    bind(BpmManagerDashboardUserService.class).to(BpmManagerDashboardUserServiceImpl.class);
    bind(BpmManagerDashboardTaskService.class).to(BpmManagerDashboardTaskServiceImpl.class);
    bind(AppLoaderImportServiceImpl.class).to(AppLoaderImportBpmServiceImpl.class);
    bind(ServerStartListener.class);

    bind(BpmErrorMessageService.class).to(BpmErrorMessageServiceImpl.class);
    bind(WkfMigrationService.class).to(WkfMigrationServiceImpl.class);

    bind(StudioMetaService.class).to(StudioMetaServiceImpl.class);
    bind(JsonFieldService.class).to(JsonFieldServiceImpl.class);
    bind(FilterSqlService.class).to(FilterSqlServiceImpl.class);
    bind(FilterJpqlService.class).to(FilterJpqlServiceImpl.class);
    bind(FilterGroovyService.class).to(FilterGroovyServiceImpl.class);
    bind(FilterCommonService.class).to(FilterCommonServiceImpl.class);
    bind(StudioSelectionService.class).to(StudioSelectionServiceImpl.class);
    bind(StudioMenuService.class).to(StudioMenuServiceImpl.class);
    bind(StudioDashboardService.class).to(StudioDashboardServiceImpl.class);
    bind(StudioChartService.class).to(StudioChartServiceImpl.class);
    bind(StudioAppService.class).to(StudioAppServiceImpl.class);
    bind(StudioActionViewService.class).to(StudioActionViewServiceImpl.class);
    bind(StudioActionService.class).to(StudioActionServiceImpl.class);
    bind(StudioActionScriptService.class).to(StudioActionScriptServiceImpl.class);
    bind(StudioActionEmailService.class).to(StudioActionEmailServiceImpl.class);
    bind(ReportBuilderService.class).to(ReportBuilderServiceImpl.class);
    bind(ProcessEngineService.class).to(ProcessEngineServiceImpl.class);
    bind(WkfNodeService.class).to(WkfNodeServiceImpl.class);
    bind(WkfMenuService.class).to(WkfMenuServiceImpl.class);
    bind(WkfLogService.class).to(WkfLogServiceImpl.class);
    bind(WkfLoggerInitService.class).to(WkfLoggerInitServiceImpl.class);
    bind(WkfBpmImportService.class).to(WkfBpmImportServiceImpl.class);
    bind(WkfModelImportListener.class);
    bind(ProcessInstanceModificationService.class).to(ProcessInstanceModificationServiceImpl.class);
    bind(WkfModelMergerSplitterService.class).to(WkfModelMergerSplitterServiceImpl.class);
  }
}
