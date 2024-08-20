package com.axelor.studio.bpm.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.utils.helpers.ExceptionHelper;

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
}
