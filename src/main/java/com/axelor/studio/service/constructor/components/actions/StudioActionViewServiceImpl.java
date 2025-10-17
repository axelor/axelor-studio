/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.actions;

import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.StudioActionView;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.GroovyTemplateService;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.text.StringEscapeUtils;

public class StudioActionViewServiceImpl implements StudioActionViewService {

  protected static final String TEMPLATE_PATH = "templates/actionView.tmpl";

  protected StudioMetaService metaService;
  protected GroovyTemplateService groovyTemplateService;

  @Inject
  public StudioActionViewServiceImpl(
      StudioMetaService metaService, GroovyTemplateService groovyTemplateService) {
    this.metaService = metaService;
    this.groovyTemplateService = groovyTemplateService;
  }

  @Override
  public MetaAction build(StudioAction studioAction) {

    if (studioAction == null) {
      return null;
    }

    List<StudioActionView> views = studioAction.getStudioActionViews();
    if (views == null || views.isEmpty()) {
      return null;
    }

    String model = MetaJsonRecord.class.getName();
    if (Boolean.FALSE.equals(studioAction.getIsJson())) {
      model = studioAction.getModel();
    }

    Map<String, Object> binding = new HashMap<>();
    binding.put("name", studioAction.getName());
    binding.put("title", studioAction.getTitle());
    binding.put("id", studioAction.getXmlId());
    binding.put("views", views);
    binding.put("params", studioAction.getViewParams());

    if (!Strings.isNullOrEmpty(studioAction.getModel())) {
      binding.put("model", model);
      binding.put("jsonModel", studioAction.getModel());
    }

    if (!Strings.isNullOrEmpty(studioAction.getModel())) {
      bindDomain(studioAction.getDomainCondition(), studioAction.getIsJson(), binding);
    }

    bindContext(studioAction, binding);

    String xml = groovyTemplateService.createXmlWithGroovyTemplate(TEMPLATE_PATH, binding);

    return metaService.updateMetaAction(
        studioAction.getName(), "action-view", xml, model, studioAction.getXmlId());
  }

  @Override
  public void bindContext(StudioAction studioAction, Map<String, Object> binding) {
    List<Map<String, Object>> contexts = new ArrayList<>();
    boolean addJsonCtx = true;
    if (studioAction.getLines() != null) {
      for (StudioActionLine context : studioAction.getLines()) {
        Map<String, Object> contextMap = new HashMap<>();
        if (context.getName().contentEquals("jsonModel")) {
          addJsonCtx = false;
        }
        contextMap.put("name", context.getName());
        String contextValue = context.getValue();
        if (contextValue.startsWith("eval:")
            || contextValue.startsWith("call:")
            || contextValue.startsWith("action:")
            || contextValue.startsWith("select:")
            || contextValue.startsWith("select[]:")) {
          contextMap.put("value", StringEscapeUtils.escapeXml11(contextValue));
        } else {
          contextMap.put("value", "eval:" + StringEscapeUtils.escapeXml11(contextValue));
        }
        contexts.add(contextMap);
      }
    }
    binding.put("contexts", contexts);

    addJsonCtx = addJsonCtx && studioAction.getIsJson() && studioAction.getModel() != null;
    binding.put("addJsonCtx", addJsonCtx);
  }

  @Override
  public void bindDomain(String domain, Boolean isJson, Map<String, Object> binding) {

    if (Boolean.TRUE.equals(isJson)) {
      String jsonDomain = "self.jsonModel = :jsonModel";
      if (domain == null) {
        domain = jsonDomain;
      } else if (!domain.contains(jsonDomain)) {
        domain = jsonDomain + " AND (" + domain + ")";
      }
    }
    binding.put("domainNoNull", domain != null);
    if (domain != null) {
      binding.put("domain", StringEscapeUtils.escapeXml11(domain));
    }
  }
}
