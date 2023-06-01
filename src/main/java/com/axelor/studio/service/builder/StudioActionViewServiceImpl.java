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
package com.axelor.studio.service.builder;

import com.axelor.common.StringUtils;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.StudioActionView;
import com.axelor.studio.service.StudioMetaService;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import java.util.List;
import org.apache.commons.lang3.StringEscapeUtils;

public class StudioActionViewServiceImpl implements StudioActionViewService {

  protected static final String INDENT = "\t";

  protected StudioMetaService metaService;

  @Inject
  public StudioActionViewServiceImpl(StudioMetaService metaService) {
    this.metaService = metaService;
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

    StringBuilder xml = new StringBuilder();

    String model = appendBasic(studioAction, xml);

    appendViews(views, xml);

    appendParams(studioAction.getViewParams(), xml);

    if (!Strings.isNullOrEmpty(studioAction.getModel())) {
      appendDomain(studioAction.getDomainCondition(), studioAction.getIsJson(), xml);
    }

    appendContext(studioAction, xml);

    xml.append("\n" + "</action-view>");

    return metaService.updateMetaAction(
        studioAction.getName(), "action-view", xml.toString(), model, studioAction.getXmlId());
  }

  protected void appendParams(List<StudioActionLine> params, StringBuilder xml) {

    if (params == null) {
      return;
    }

    for (StudioActionLine param : params) {
      xml.append("\n" + INDENT + "<view-param name=\"" + param.getName() + "\" ");
      xml.append("value=\"" + StringEscapeUtils.escapeXml(param.getValue()) + "\" />");
    }
  }

  protected void appendContext(StudioAction studioAction, StringBuilder xml) {
    boolean addJsonCtx = true;
    if (studioAction.getLines() != null) {
      for (StudioActionLine context : studioAction.getLines()) {
        if (context.getName().contentEquals("jsonModel")) {
          addJsonCtx = false;
        }
        xml.append("\n" + INDENT + "<context name=\"" + context.getName() + "\" ");
        String contextValue = context.getValue();
        if (contextValue.startsWith("eval:")
            || contextValue.startsWith("call:")
            || contextValue.startsWith("action:")
            || contextValue.startsWith("select:")
            || contextValue.startsWith("select[]:")) {
          xml.append("expr=\"" + StringEscapeUtils.escapeXml(contextValue) + "\" />");
        } else {
          xml.append("expr=\"eval:" + StringEscapeUtils.escapeXml(contextValue) + "\" />");
        }
      }
    }

    if (addJsonCtx && studioAction.getIsJson() && studioAction.getModel() != null) {
      xml.append("\n" + INDENT + "<context name=\"jsonModel\" ");
      xml.append("expr=\"" + studioAction.getModel() + "\" />");
    }
  }

  protected void appendDomain(String domain, Boolean isJson, StringBuilder xml) {

    if (isJson) {
      String jsonDomain = "self.jsonModel = :jsonModel";
      if (domain == null) {
        domain = jsonDomain;
      } else if (!domain.contains(jsonDomain)) {
        domain = jsonDomain + " AND (" + domain + ")";
      }
    }

    if (domain != null) {
      xml.append("\n" + INDENT + "<domain>" + StringEscapeUtils.escapeXml(domain) + "</domain>");
    }
  }

  protected void appendViews(List<StudioActionView> views, StringBuilder xml) {

    views.sort((action1, action2) -> action1.getSequence().compareTo(action2.getSequence()));
    for (StudioActionView view : views) {
      xml.append("\n" + INDENT + "<view type=\"" + view.getViewType() + "\" ");
      xml.append("name=\"" + view.getViewName() + "\" ");
      if (StringUtils.notEmpty(view.getViewConditionToCheck())) {
        xml.append("if=\"" + view.getViewConditionToCheck() + "\" />");
      } else {
        xml.append("/>");
      }
    }
  }

  protected String appendBasic(StudioAction studioAction, StringBuilder xml) {

    xml.append("<action-view name=\"" + studioAction.getName() + "\" ");
    xml.append("title=\"" + studioAction.getTitle() + "\" ");
    xml.append("id=\"" + studioAction.getXmlId() + "\" ");

    String model = MetaJsonRecord.class.getName();
    if (!studioAction.getIsJson()) {
      model = studioAction.getModel();
    }

    if (!Strings.isNullOrEmpty(studioAction.getModel())) {
      xml.append("model=\"" + model + "\" ");
    }
    xml.append(">");

    return model;
  }
}
