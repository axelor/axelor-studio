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
package com.axelor.studio.service.constructor.reporting;

import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.schema.views.AbstractWidget;
import com.axelor.meta.schema.views.Dashboard;
import com.axelor.meta.schema.views.Dashlet;
import com.axelor.studio.db.StudioDashboard;
import com.axelor.studio.db.StudioDashlet;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.GroovyTemplateService;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This service class used to generate dashboard from ViewBuilder of type Dashboard. It will take
 * all selected charts and generate xml from it.
 *
 * @author axelor
 */
public class StudioDashboardServiceImpl implements StudioDashboardService {

  protected static final String TEMPLATE_PATH = "templates/dashboardActionView.tmpl";

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected StudioMetaService metaService;
  protected GroovyTemplateService groovyTemplateService;

  @Inject
  public StudioDashboardServiceImpl(
      StudioMetaService metaService, GroovyTemplateService groovyTemplateService) {
    this.metaService = metaService;
    this.groovyTemplateService = groovyTemplateService;
  }

  /**
   * Method to generate Dashboard (meta schema) from a StudioDashboard.
   *
   * @param studioDashboard the StudioDashboard to use.
   * @return MetaView.
   */
  @Override
  public MetaView build(StudioDashboard studioDashboard) {

    log.debug("Processing dashboard: {}", studioDashboard.getName());

    log.debug("Dashlet list: {}", studioDashboard.getStudioDashletList());

    if (studioDashboard.getStudioDashletList() == null
        || studioDashboard.getStudioDashletList().isEmpty()) {
      return null;
    }

    Dashboard dashboard = new Dashboard();
    String boardName = studioDashboard.getName();
    dashboard.setTitle(studioDashboard.getTitle());
    dashboard.setName(studioDashboard.getName());
    List<AbstractWidget> dashlets = new ArrayList<>();

    studioDashboard.clearGeneratedActions();
    studioDashboard
        .getStudioDashletList()
        .forEach(
            studioDashlet -> {
              Dashlet dashlet = new Dashlet();
              String name = null;
              String model = null;
              MetaView metaView = studioDashlet.getMetaView();
              MetaAction action = studioDashlet.getAction();

              String actionName = null;
              if (metaView != null) {
                name = metaView.getName();
                model = metaView.getModel();
                MetaAction metaAction = getAction(boardName, name, model, studioDashlet);
                actionName = metaAction.getName();
                studioDashboard.addGeneratedAction(metaAction);
              } else if (action != null) {
                model = action.getModel();
                actionName = action.getName();
              }

              dashlet.setAction(actionName);
              Integer height = studioDashlet.getHeight();
              if (height == 0) {
                height = 350;
              }
              dashlet.setHeight(height.toString());
              dashlet.setCanSearch(studioDashlet.getCanSearch());

              Integer colSpan = studioDashlet.getColspan();
              if (colSpan > 12) {
                colSpan = 12;
              } else if (colSpan <= 0) {
                colSpan = 6;
              }

              dashlet.setColSpan(colSpan.toString());
              dashlets.add(dashlet);
            });

    if (dashlets.isEmpty()) {
      return null;
    }

    dashboard.setItems(dashlets);

    MetaStore.clear();

    return metaService.generateMetaView(dashboard);
  }

  /**
   * Method to generate action-view for a chart
   *
   * @param dashboard name in which chart to be used.
   * @param name view name
   * @param model Chart to open from action-view.
   * @param studioDashlet to use.
   * @return Name of action-view.
   */
  @Override
  public MetaAction getAction(
      String dashboard, String name, String model, StudioDashlet studioDashlet) {

    String actionName = "action-" + (dashboard + "-" + name).replace(".", "-");

    boolean isJson = model != null && model.contentEquals(MetaJsonRecord.class.getName());

    String otherView = "form";
    String view = studioDashlet.getViewType();
    if (view.equals("form")) {
      otherView = "grid";
    }
    Map<String, Object> binding = new HashMap<>();

    String xmlId = actionName;
    binding.put("name", actionName);
    binding.put("id", xmlId);
    binding.put("title", studioDashlet.getName());
    binding.put("hasModel", model != null);
    if (model != null) {
      binding.put("model", model);
    }
    binding.put("viewType1", view);
    binding.put("viewName1", name);
    binding.put("viewType2", otherView);

    binding.put("isJson", isJson);
    if (isJson) {
      binding.put("viewName2", name.replace("-" + view, "-" + otherView));
    }
    binding.put("hasPaginationValue", studioDashlet.getPaginationLimit() > 0);
    if (studioDashlet.getPaginationLimit() > 0) {
      binding.put("paginationValue", studioDashlet.getPaginationLimit().toString());
    }
    if (isJson) {
      String[] models = name.split("-");
      binding.put("jsonModel", models[models.length - 2]);
    }
    String xml = groovyTemplateService.createXmlWithGroovyTemplate(TEMPLATE_PATH, binding);

    return metaService.updateMetaAction(actionName, "action-view", xml, model, xmlId);
  }
}
