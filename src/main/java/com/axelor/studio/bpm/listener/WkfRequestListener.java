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
package com.axelor.studio.bpm.listener;

import com.axelor.db.EntityHelper;
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.event.Observes;
import com.axelor.events.PostAction;
import com.axelor.events.PostRequest;
import com.axelor.events.RequestEvent;
import com.axelor.events.internal.BeforeTransactionComplete;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.context.WkfCache;
import com.axelor.studio.bpm.service.WkfDisplayService;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.google.inject.Inject;
import com.google.inject.name.Named;
import com.google.inject.persist.Transactional;
import java.lang.invoke.MethodHandles;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.collections.MultiMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfRequestListener {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfInstanceRepository wkfInstanceRepo;
  protected WkfInstanceService wkfInstanceService;
  protected WkfDisplayService wkfDisplayService;

  @Inject
  public WkfRequestListener(
      WkfInstanceRepository wkfInstanceRepo,
      WkfInstanceService wkfInstanceService,
      WkfDisplayService wkfDisplayService) {

    this.wkfInstanceRepo = wkfInstanceRepo;
    this.wkfInstanceService = wkfInstanceService;
    this.wkfDisplayService = wkfDisplayService;
  }

  public void onBeforeTransactionComplete(@Observes BeforeTransactionComplete event)
      throws ClassNotFoundException {
    applyProcessChange(
        event.getUpdated(), event.getDeleted(), WkfInstanceServiceImpl.EXECUTION_SOURCE_OBSERVER);
  }

  public void applyProcessChange(
      Set<? extends Model> updated, Set<? extends Model> deleted, int source)
      throws ClassNotFoundException {

    String tenantId = BpmTools.getCurrentTenant();
    if (!WkfCache.WKF_MODEL_CACHE.containsKey(tenantId)) {
      WkfCache.initWkfModelCache();
    }

    processUpdated(updated, tenantId, source);
    processDeleted(deleted, tenantId, source);
  }

  private void processUpdated(Set<? extends Model> updated, String tenantId, Integer source)
      throws ClassNotFoundException {
    updated = new HashSet<>(updated);
    for (Model model : updated) {
      String modelName = EntityHelper.getEntityClass(model).getName();
      if (model instanceof MetaJsonRecord metaJsonRecord) {
        modelName = metaJsonRecord.getJsonModel();
      }

      if (WkfCache.WKF_MODEL_CACHE.get(tenantId).containsValue(modelName)) {
        log.trace("Eval workflow from updated model: {}, id: {}", modelName, model.getId());
        wkfInstanceService.evalInstance(model, null, source);
      }
    }
  }

  @SuppressWarnings("unchecked")
  public void onRequest(@Observes PostAction postAction) throws ClassNotFoundException {

    Context context = postAction.getContext();

    if (context == null
        || postAction.getName().equals("com.axelor.meta.web.MetaController:moreAttrs")) {
      return;
    }

    String signal = (String) context.get("_signal");
    if (signal == null) {
      return;
    }

    Boolean wkfEvaluated = (Boolean) context.get("_wkfEvaluated");

    if (wkfEvaluated != null && wkfEvaluated) {
      return;
    }

    String tenantId = BpmTools.getCurrentTenant();

    if (!WkfCache.WKF_MODEL_CACHE.containsKey(tenantId)) {
      WkfCache.initWkfModelCache();
    }

    Map<Long, String> modelMap = WkfCache.WKF_MODEL_CACHE.get(tenantId);

    Class<? extends Model> model = (Class<? extends Model>) context.getContextClass();

    String modelName = model.getName();

    if (model.equals(MetaJsonRecord.class)) {
      modelName = (String) context.get("jsonModel");
    }

    if (modelMap != null && modelMap.containsValue(modelName)) {
      Long id = (Long) context.get("id");
      if (!WkfCache.WKF_BUTTON_CACHE.containsKey(tenantId)) {
        WkfCache.initWkfButttonCache();
      }
      MultiMap multiMap = WkfCache.WKF_BUTTON_CACHE.get(tenantId);

      if (multiMap != null && multiMap.containsValue(signal) && id != null) {
        Object res = postAction.getResult();
        log.trace("Wkf button cache: {}", WkfCache.WKF_BUTTON_CACHE);
        log.trace("Eval wkf from button model: {}, id: {}", model.getName(), id);
        String helpText = wkfInstanceService.evalInstance(JPA.find(model, id), signal);

        if (res instanceof ActionResponse response && helpText != null) {
          response.setAlert(helpText);
        }
      }
    }
    context.put("_wkfEvaluated", true);
  }

  @SuppressWarnings("all")
  public void onFetch(@Observes @Named(RequestEvent.FETCH) PostRequest event) {

    Object obj = event.getResponse().getItem(0);

    if (obj instanceof Map values) {
      if (values != null && values.get("id") != null) {

        List<Map<String, Object>> wkfStatus =
            wkfDisplayService.getWkfStatus(
                event.getRequest().getBeanClass(), Long.parseLong(values.get("id").toString()));
        if (wkfStatus.isEmpty()) {
          wkfStatus = null;
        }
        values.put("$wkfStatus", wkfStatus);
      }
    }
  }

  @Transactional(rollbackOn = Exception.class)
  public void processDeleted(Set<? extends Model> deleted, String tenantId, Integer source) {

    for (Model model : deleted) {
      String modelName = EntityHelper.getEntityClass(model).getName();
      if (model instanceof MetaJsonRecord metaJsonRecord) {
        modelName = metaJsonRecord.getJsonModel();
      }

      if (WkfCache.WKF_MODEL_CACHE.get(tenantId).containsValue(modelName)) {
        log.trace("Remove wkf instance of deleted model: {}, id: {}", modelName, model.getId());
        WkfInstance wkfInstance = wkfInstanceRepo.findByInstanceId(model.getProcessInstanceId());
        if (wkfInstance != null
            && wkfInstance.getWkfProcess().getWkfProcessConfigList().size() == 1) {
          wkfInstanceRepo.remove(wkfInstance);
        }
      }
    }
  }
}
