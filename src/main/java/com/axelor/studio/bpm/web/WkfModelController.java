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
package com.axelor.studio.bpm.web;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.common.Inflector;
import com.axelor.common.StringUtils;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.meta.schema.actions.ActionView.ActionViewBuilder;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.pojo.MergeSplitContributor;
import com.axelor.studio.bpm.pojo.MergeSplitResult;
import com.axelor.studio.bpm.service.WkfBpmImportService;
import com.axelor.studio.bpm.service.WkfDisplayService;
import com.axelor.studio.bpm.service.WkfModelMergerSplitterService;
import com.axelor.studio.bpm.service.WkfModelService;
import com.axelor.studio.bpm.service.app.AppBpmService;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardCommonService;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentService;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.bpm.service.message.BpmErrorMessageService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfInstanceVariable;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.MapHelper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class WkfModelController {

  protected static final String PROCESS_PER_STATUS = "processPerStatus";
  protected static final String PROCESS_PER_USER = "processPerUser";

  @SuppressWarnings("unchecked")
  public void deploy(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();

      WkfModel wkfModel = context.asType(WkfModel.class);

      Map<String, Object> migrationMap = (Map<String, Object>) context.get("wkfMigrationMap");

      Boolean isMigrateOld = (Boolean) context.get("isMigrateOld");

      if (isMigrateOld != null && !isMigrateOld) {
        migrationMap = null;
      }

      wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());
      if (wkfModel.getIsMigrationOnGoing()) {
        response.setError(I18n.get(BpmExceptionMessage.MIGRATION_IS_ALREADY_ONGOING));
      } else {
        Beans.get(BpmDeploymentService.class).deploy(null, wkfModel, migrationMap, false);
        response.setReload(true);
      }

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
      WkfModel model = request.getContext().asType(WkfModel.class);
      model = Beans.get(WkfModelRepository.class).find(model.getId());
      Beans.get(BpmDeploymentService.class).setIsMigrationOnGoing(model, false);
      Beans.get(BpmErrorMessageService.class)
          .sendBpmErrorMessage(
              null, e.getMessage(), Beans.get(WkfModelRepository.class).find(model.getId()), null);
    }
  }

  public void terminateAllProcesses(ActionRequest request, ActionResponse response) {
    try {
      Beans.get(WkfInstanceService.class).terminateAll();
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void refreshRecord(ActionRequest request, ActionResponse response) {

    response.setReload(true);
  }

  public void start(ActionRequest request, ActionResponse response) {
    try {
      WkfModel wkfModel = request.getContext().asType(WkfModel.class);

      wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());

      Beans.get(WkfModelService.class).start(null, wkfModel);

      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void terminate(ActionRequest request, ActionResponse response) {
    try {
      WkfModel wkfModel = request.getContext().asType(WkfModel.class);

      wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());

      Beans.get(WkfModelService.class).terminate(wkfModel);

      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void backToDraft(ActionRequest request, ActionResponse response) {
    try {
      WkfModel wkfModel = request.getContext().asType(WkfModel.class);

      wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());

      Beans.get(WkfModelService.class).backToDraft(wkfModel);

      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void createNewVersion(ActionRequest request, ActionResponse response) {
    try {
      WkfModel wkfModel = request.getContext().asType(WkfModel.class);

      wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());

      wkfModel = Beans.get(WkfModelService.class).createNewVersion(wkfModel);

      response.setValue("newVersionId", wkfModel.getId());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void showVersions(ActionRequest request, ActionResponse response) {
    try {
      WkfModel wkfModel = request.getContext().asType(WkfModel.class);

      List<Long> versionIds = new ArrayList<>();

      if (wkfModel.getId() != null) {
        wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());
        versionIds = Beans.get(WkfModelService.class).findVersions(wkfModel);
      }

      versionIds.add(0l);

      response.setView(
          ActionView.define(I18n.get("Previous Versions"))
              .model(WkfModel.class.getName())
              .add("grid", "wkf-model-grid")
              .add("form", "wkf-model-form")
              .domain("self.id in :versionIds")
              .context("versionIds", versionIds)
              .map());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getInstanceXml(ActionRequest request, ActionResponse response) {
    try {
      String instanceId = (String) request.getContext().get("instanceId");

      String xml = Beans.get(WkfInstanceService.class).getInstanceXml(instanceId);

      response.setValue("xml", xml);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void importWkfModels(ActionRequest request, ActionResponse response) {
    try {
      Context ctx = request.getContext();
      boolean translate =
          Optional.ofNullable(ctx.get("translate")).map(i -> (boolean) i).orElse(false);

      String sourceLanguage = (String) ctx.get("sourceLanguageSelect");
      String targetLanguage = (String) ctx.get("targetLanguageSelect");

      MetaFile metaFile = MapHelper.get(ctx, MetaFile.class, "dataFile");

      String logText =
          Beans.get(WkfModelService.class)
              .importWkfModels(metaFile, translate, sourceLanguage, targetLanguage);

      if (StringUtils.isEmpty(logText)) {
        response.setInfo(I18n.get(BpmExceptionMessage.NO_WKF_MODEL_IMPORTED));
      } else {
        response.setValue("importLog", logText);
      }

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void restart(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();

      String processInstanceId = (String) context.get("processInstanceId");
      String activityId = (String) context.get("activityId");
      String processName = (String) context.get("processId");

      if (processInstanceId != null && activityId != null && processName != null) {
        Beans.get(WkfInstanceService.class).restart(processInstanceId, processName, activityId);

        String updatedUrl =
            Beans.get(WkfDisplayService.class)
                .getInstanceUrl(
                    Beans.get(WkfInstanceRepository.class).findByInstanceId(processInstanceId));
        response.setValue("updatedUrl", updatedUrl);
      }

      response.setInfo(I18n.get("Instance Restarted"));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void cancelNode(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();

      String processInstanceId = (String) context.get("processInstanceId");
      String activityId = (String) context.get("activityId");

      if (processInstanceId != null && activityId != null) {
        Beans.get(WkfInstanceService.class).cancelNode(processInstanceId, activityId);
      }

      response.setInfo(I18n.get("Node cancelled"));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getProcessPerStatus(ActionRequest request, ActionResponse response) {
    try {
      List<Map<String, Object>> dataList = this.getDataList(request, PROCESS_PER_STATUS);
      response.setData(dataList);

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getProcessPerUser(ActionRequest request, ActionResponse response) {
    try {
      List<Map<String, Object>> dataList = this.getDataList(request, PROCESS_PER_USER);
      response.setData(dataList);

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  protected List<Map<String, Object>> getDataList(ActionRequest request, String type) {
    Object id = request.getData().get("id");
    if (id == null) {
      return Collections.emptyList();
    }
    WkfModel wkfModel = Beans.get(WkfModelRepository.class).find(Long.valueOf(id.toString()));

    return switch (type) {
      case PROCESS_PER_STATUS -> Beans.get(WkfModelService.class).getProcessPerStatus(wkfModel);
      case PROCESS_PER_USER -> Beans.get(WkfModelService.class).getProcessPerUser(wkfModel);
      default -> Collections.emptyList();
    };
  }

  protected void openRecordView(
      ActionRequest request,
      ActionResponse response,
      String statusKey,
      String modelKey,
      String recordKey) {

    Map<String, Object> ctx = getDataCtx(request);

    String status = statusKey != null ? MapHelper.get(ctx, String.class, "title") : "";
    String modelName = MapHelper.get(ctx, String.class, modelKey);
    boolean isMetaModel = MapHelper.get(ctx, Boolean.class, "isMetaModel");
    List<Long> recordIds = MapHelper.getCollection(ctx, Long.class, recordKey);

    ActionViewBuilder actionViewBuilder =
        Beans.get(WkfDashboardCommonService.class)
            .computeActionView(status, modelName, isMetaModel);

    response.setView(actionViewBuilder.context("ids", recordIds.isEmpty() ? 0 : recordIds).map());
  }

  @SuppressWarnings("unchecked")
  protected Map<String, Object> getDataCtx(ActionRequest request) {
    return (Map<String, Object>) request.getData().get("context");
  }

  public void getStatusPerView(ActionRequest request, ActionResponse response) {
    try {
      this.openRecordView(request, response, "title", "modelName", "statusRecordIds");

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getModelPerView(ActionRequest request, ActionResponse response) {
    try {
      this.openRecordView(request, response, null, "modelName", "recordIdsPerModel");

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void openNewRecord(ActionRequest request, ActionResponse response) {
    try {
      Map<String, Object> ctx = getDataCtx(request);
      String modelName = MapHelper.get(ctx, String.class, "modelName");
      boolean isMetaModel = MapHelper.get(ctx, Boolean.class, "isMetaModel");

      ActionViewBuilder actionViewBuilder = this.viewNewRecord(modelName, isMetaModel);
      response.setView(actionViewBuilder.map());

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void openNewInstance(ActionRequest request, ActionResponse response) {
    try {
      Map<String, Object> ctx = getDataCtx(request);
      WkfProcessConfig config = MapHelper.get(ctx, WkfProcessConfig.class, "processConfig");

      boolean isMetaModel = config.getMetaModel() != null;
      String modelName =
          isMetaModel ? config.getMetaModel().getName() : config.getMetaJsonModel().getName();

      ActionViewBuilder actionViewBuilder = this.viewNewRecord(modelName, isMetaModel);
      response.setView(actionViewBuilder.map());

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  protected ActionViewBuilder viewNewRecord(String modelName, boolean isMetaModel) {
    ActionViewBuilder actionViewBuilder = null;
    if (isMetaModel) {
      MetaModel metaModel = Beans.get(MetaModelRepository.class).findByName(modelName);
      String viewPrefix = Inflector.getInstance().dasherize(metaModel.getName());

      actionViewBuilder =
          ActionView.define(I18n.get(metaModel.getName()))
              .model(metaModel.getFullName())
              .add("form", viewPrefix + "-form");

    } else {
      MetaJsonModel metaJsonModel = Beans.get(MetaJsonModelRepository.class).findByName(modelName);

      actionViewBuilder =
          ActionView.define(I18n.get(metaJsonModel.getTitle()))
              .model(MetaJsonRecord.class.getName())
              .add("form", metaJsonModel.getFormView().getName())
              .domain("self.jsonModel = :jsonModel")
              .context("jsonModel", modelName);
    }
    return actionViewBuilder;
  }

  public void changeAttrs(ActionRequest request, ActionResponse response) {
    try {
      WkfModel wkfModel = request.getContext().asType(WkfModel.class);
      wkfModel = Beans.get(WkfModelRepository.class).find(wkfModel.getId());
      User user = AuthUtils.getUser();
      boolean bpmAdministrator = user.getIsBpmAdministrator();
      if (bpmAdministrator) {
        return;
      }

      WkfDashboardCommonService wkfDashboardCommonService =
          Beans.get(WkfDashboardCommonService.class);

      if (wkfDashboardCommonService.isAdmin(wkfModel, user)) {
        return;
      }

      response.setAttr("actionPanelBtn", "hidden", true);
      response.setAttr("adminPanel", "hidden", true);
      response.setAttr("managerPanel", "hidden", true);

      if (wkfDashboardCommonService.isManager(wkfModel, user)) {
        return;
      }

      response.setAttr("allProcessPanel", "hidden", true);

      if (wkfDashboardCommonService.isUser(wkfModel, user)) {
        return;
      }

      response.setAttr("userPanel", "hidden", true);
      response.setAttr("myProcessPanel", "hidden", true);

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void openTaskToday(ActionRequest request, ActionResponse response) {
    try {
      this.openRecordView(request, response, null, "modelName", "taskTodayIds");

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void openTaskNext(ActionRequest request, ActionResponse response) {
    try {
      this.openRecordView(request, response, null, "modelName", "taskNextIds");

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void openLateTask(ActionRequest request, ActionResponse response) {
    try {
      this.openRecordView(request, response, null, "modelName", "lateTaskIds");

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void clearInstanceLog(ActionRequest request, ActionResponse response) {
    try {
      WkfInstance instance = request.getContext().asType(WkfInstance.class);
      instance = Beans.get(WkfInstanceRepository.class).find(instance.getId());
      Beans.get(WkfLogService.class).clearLog(instance.getInstanceId());
      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void showInstanceVariables(ActionRequest request, ActionResponse response) {
    try {
      WkfInstance instance = request.getContext().asType(WkfInstance.class);
      instance = Beans.get(WkfInstanceRepository.class).find(instance.getId());
      List<WkfInstanceVariable> variableList =
          Beans.get(WkfInstanceService.class).getWkfInstanceVariables(instance);
      response.setValue("$variableList", variableList);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void showInstanceLog(ActionRequest request, ActionResponse response) {
    try {
      WkfInstance instance = request.getContext().asType(WkfInstance.class);
      String filter = (String) request.getContext().get("wkfLogFilter");
      Integer minutes = (Integer) request.getContext().get("minutes");
      String startString = (String) request.getContext().get("startDate");
      String endString = (String) request.getContext().get("endDate");
      response.setValue(
          "$logText",
          Beans.get(WkfInstanceService.class)
              .getInstanceLogs(instance, filter, startString, endString, minutes));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void splitWkfModel(ActionRequest request, ActionResponse response) {
    try {
      String contributerJson = (String) request.getData().get("contributor");
      ObjectMapper objectMapper = new ObjectMapper();
      MergeSplitContributor contributor =
          objectMapper.readValue(contributerJson, MergeSplitContributor.class);
      List<String> results = Beans.get(WkfModelMergerSplitterService.class).split(contributor);
      response.setValue("results", results);
    } catch (Exception e) {
      ExceptionHelper.error(e);
      response.setError(e.getMessage());
    }
  }

  public void mergeWkfModel(ActionRequest request, ActionResponse response) {
    try {
      String contributorsJson = (String) request.getData().get("contributor");
      ObjectMapper objectMapper = new ObjectMapper();
      List<MergeSplitContributor> contributors =
          objectMapper.readValue(
              contributorsJson, new TypeReference<List<MergeSplitContributor>>() {});
      String result = Beans.get(WkfModelMergerSplitterService.class).merge(contributors);
      response.setValue("result", result);
    } catch (Exception e) {
      ExceptionHelper.error(e);
      response.setError(e.getMessage());
    }
  }

  public void saveAndDeploy(ActionRequest request, ActionResponse response) {
    try {
      String contributorJson = (String) request.getData().get("contributor");
      String resultsString = (String) request.getData().get("results");
      Boolean deploy = (Boolean) request.getData().get("deploy");
      ObjectMapper objectMapper = new ObjectMapper();
      List<MergeSplitContributor> contributors =
          objectMapper.readValue(
              contributorJson, new TypeReference<List<MergeSplitContributor>>() {});
      List<MergeSplitResult> results =
          objectMapper.readValue(resultsString, new TypeReference<List<MergeSplitResult>>() {});
      List<Long> createdWkfModels =
          Beans.get(WkfModelMergerSplitterService.class).save(results, contributors, deploy);
      response.setValue("createdWkfModels", createdWkfModels);
    } catch (Exception e) {
      ExceptionHelper.error(e);
      response.setError(e.getMessage());
    }
  }

  public void openSplitEditor(ActionRequest request, ActionResponse response) {
    try {
      List<Integer> ids = (List<Integer>) request.getContext().get("_ids");
      String link = Beans.get(WkfModelMergerSplitterService.class).getSplitUrl(ids);
      if (link != null) {
        response.setView(ActionView.define("Split editor").add("html", link).map());
      }

    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
  }

  public void openMergeEditor(ActionRequest request, ActionResponse response) {
    try {
      List<Integer> ids = (List<Integer>) request.getContext().get("_ids");
      String link = Beans.get(WkfModelMergerSplitterService.class).getMergeUrl(ids);
      if (link != null) {
        response.setView(ActionView.define("Merge editor").add("html", link).map());
      }
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
  }

  public void unblockInstanceFromModel(ActionRequest request, ActionResponse response) {
    WkfModel wkfModel = request.getContext().asType(WkfModel.class);
    Beans.get(WkfInstanceService.class).evalInstancesFromWkfModel(wkfModel);
    response.setInfo("Operation completed");
  }

  public void importBpmnModelFromSources(ActionRequest request, ActionResponse response) {
    if (!Beans.get(AppBpmService.class).getAppBpm().getAllowBpmLoadingFromSources()) {
      response.setError(I18n.get(StudioExceptionMessage.STUDIO_BPM_SOURCE_IMPORT_NOT_ALLOWED));
    } else {
      String code = request.getContext().asType(WkfModel.class).getCode();
      try {
        Beans.get(WkfBpmImportService.class).importWkfModel(code);
      } catch (IOException e) {
        throw new RuntimeException(e);
      } catch (IllegalArgumentException e) {
        response.setError(I18n.get(e.getMessage()));
      }
    }
  }

  public void forceMigrate(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();
      WkfProcess wkfProcess = context.asType(WkfProcess.class);
      Beans.get(BpmDeploymentService.class).forceMigrate(wkfProcess);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
