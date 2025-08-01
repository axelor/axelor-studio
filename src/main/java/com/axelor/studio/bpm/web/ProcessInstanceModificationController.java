package com.axelor.studio.bpm.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.ProcessInstanceModificationService;
import com.axelor.studio.db.WkfProcessUpdate;
import com.axelor.studio.db.repo.WkfProcessUpdateRepository;
import com.axelor.utils.exception.UtilsExceptionMessage;
import com.axelor.utils.helpers.ExceptionHelper;
import java.nio.file.Path;
import java.util.Map;

public class ProcessInstanceModificationController {

  public void executeScript(ActionRequest request, ActionResponse response) {
    WkfProcessUpdate processUpdate = request.getContext().asType(WkfProcessUpdate.class);
    try {
      Beans.get(ProcessInstanceModificationService.class).execute(processUpdate);
    } catch (Exception e) {
      ExceptionHelper.error(e);
      response.setInfo(
          String.format(I18n.get(UtilsExceptionMessage.EXCEPTION_OCCURRED), e.getMessage()));
    } finally {
      response.setReload(true);
    }
  }

  public void generateScript(ActionRequest request, ActionResponse response) {
    try {
      String id = request.getContext().get("_id").toString();
      if (id != null) {
        WkfProcessUpdate processUpdate =
            Beans.get(WkfProcessUpdateRepository.class).find(Long.valueOf(id));
        Path path =
            MetaFiles.getPath(
                (String) ((Map) request.getContext().get("_operationMetaFile")).get("filePath"));
        Beans.get(ProcessInstanceModificationService.class).generateScript(processUpdate, path);
        response.setCanClose(true);
      }

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void export(ActionRequest request, ActionResponse response) {
    try {
      WkfProcessUpdate wkfProcessUpdate = request.getContext().asType(WkfProcessUpdate.class);
      Path path = Beans.get(ProcessInstanceModificationService.class).export(wkfProcessUpdate);
      response.setExportFile(path.toString());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
