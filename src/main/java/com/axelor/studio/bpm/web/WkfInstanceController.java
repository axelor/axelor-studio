package com.axelor.studio.bpm.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.List;

public class WkfInstanceController {

  public void unblockInstance(ActionRequest request, ActionResponse response) {
    try {
      WkfInstance wkfInstance = request.getContext().asType(WkfInstance.class);
      wkfInstance = Beans.get(WkfInstanceRepository.class).find(wkfInstance.getId());
      Beans.get(WkfInstanceService.class).evalInstance(wkfInstance);
      response.setInfo("Operation completed");
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }
  }

  public void showTimerBlockedInstances(ActionRequest request, ActionResponse response) {
    try {
      List<String> strings = Beans.get(WkfInstanceServiceImpl.class).getBlockedInstancesOnTimer();

      ActionView.ActionViewBuilder actionViewBuilder =
          ActionView.define(I18n.get("Timer-Blocked instances"));
      actionViewBuilder.model(WkfInstance.class.getName());
      actionViewBuilder.add("grid", "wkf-instance-grid");
      actionViewBuilder.add("form", "wkf-instance-form");
      actionViewBuilder.domain("self.instanceId IN (:strings)");
      actionViewBuilder.context("strings", strings);

      response.setView(actionViewBuilder.map());
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }
  }

  public void resumeTimerBlockedInstances(ActionRequest request, ActionResponse response) {
    try {
      List<Integer> idsList = (List<Integer>) request.getContext().get("_ids");
      WkfInstanceServiceImpl wkfInstanceServiceImpl = Beans.get(WkfInstanceServiceImpl.class);
      for (Integer instanceID : idsList) {
        wkfInstanceServiceImpl.unblockTimers(instanceID);
      }
      response.setInfo("Operation completed");
      response.setCanClose(true);
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }
  }
}
