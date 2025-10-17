/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.web;

import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.axelor.studio.dmn.service.DmnDeploymentService;
import com.axelor.studio.dmn.service.DmnExportService;
import com.axelor.studio.dmn.service.DmnImportService;
import com.axelor.studio.dmn.service.DmnService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.io.File;
import java.io.FileInputStream;
import java.util.Map;

public class WkfDmnModelController {

  public void deploy(ActionRequest request, ActionResponse response) {
    try {
      WkfDmnModel dmnModel = request.getContext().asType(WkfDmnModel.class);

      dmnModel = Beans.get(WkfDmnModelRepository.class).find(dmnModel.getId());
      Beans.get(DmnDeploymentService.class).deploy(dmnModel);

      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  @SuppressWarnings("unchecked")
  public void executeDmn(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();

      String decisionId =
          (String) ((Map<String, Object>) context.get("dmnTable")).get("decisionId");

      String ctxModel = (String) context.get("ctxModel");
      Long ctxRecordId = Long.parseLong(context.get("ctxRecordId").toString());

      if (ctxRecordId == null || ctxModel == null) {
        return;
      }

      Model model = WkfContextHelper.getRepository(ctxModel).find(ctxRecordId);

      Beans.get(DmnService.class).executeDmn(decisionId, model);

      response.setCanClose(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void createOutputToFieldScript(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();

      String decisionId = (String) context.get("decisionId");

      String ctxModel = (String) context.get("ctxModel");

      String searchWith = (String) context.get("searchWith");

      String ifMultiple = (String) context.get("ifMultiple");

      String resultVariable = (String) context.get("resultVariable");

      String script =
          Beans.get(DmnService.class)
              .createOutputToFieldScript(
                  decisionId, ctxModel, searchWith, ifMultiple, resultVariable);

      response.setValue("script", script);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void exportDmnTable(ActionRequest request, ActionResponse response) {
    try {
      WkfDmnModel dmnModel = request.getContext().asType(WkfDmnModel.class);

      dmnModel = Beans.get(WkfDmnModelRepository.class).find(dmnModel.getId());
      File file = Beans.get(DmnExportService.class).exportDmnTable(dmnModel);

      FileInputStream inStream = new FileInputStream(file);
      MetaFile exportFile =
          Beans.get(MetaFiles.class).upload(inStream, dmnModel.getName() + ".xlsx");
      inStream.close();
      file.delete();

      if (exportFile != null) {
        response.setView(
            ActionView.define(I18n.get("Export file"))
                .model(WkfDmnModel.class.getName())
                .add(
                    "html",
                    "ws/rest/com.axelor.meta.db.MetaFile/"
                        + exportFile.getId()
                        + "/content/download?v="
                        + exportFile.getVersion())
                .param("download", "true")
                .map());
      }

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  @SuppressWarnings("rawtypes")
  public void importDmnTable(ActionRequest request, ActionResponse response) {
    try {
      MetaFile dataFile =
          Beans.get(MetaFileRepository.class)
              .find(
                  Long.parseLong(
                      ((Map) request.getContext().get("dataFile")).get("id").toString()));

      Long dmnModelId = Long.parseLong(request.getContext().get("_dmnModelId").toString());
      WkfDmnModel dmnModel = Beans.get(WkfDmnModelRepository.class).find(dmnModelId);

      Beans.get(DmnImportService.class).importDmnTable(dataFile, dmnModel);

      response.setCanClose(true);

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
