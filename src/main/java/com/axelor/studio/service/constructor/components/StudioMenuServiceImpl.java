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
package com.axelor.studio.service.constructor.components;

import com.axelor.common.Inflector;
import com.axelor.db.mapper.Mapper;
import com.axelor.meta.CallMethod;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaMenu;
import com.axelor.meta.loader.XMLViews;
import com.axelor.meta.schema.ObjectViews;
import com.axelor.meta.schema.actions.Action;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.StudioActionView;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.db.repo.StudioMenuRepo;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.components.actions.StudioActionService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.WrappingHelper;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import jakarta.xml.bind.JAXBException;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

public class StudioMenuServiceImpl implements StudioMenuService {

  protected StudioActionService studioActionService;

  protected StudioMetaService metaService;

  protected StudioMenuRepo studioMenuRepo;

  @Inject
  public StudioMenuServiceImpl(
      StudioActionService studioActionService,
      StudioMetaService metaService,
      StudioMenuRepo studioMenuRepo) {
    this.studioActionService = studioActionService;
    this.metaService = metaService;
    this.studioMenuRepo = studioMenuRepo;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public MetaMenu build(StudioMenu studioMenu) throws IOException, ClassNotFoundException {

    MetaMenu menu = metaService.createMenu(studioMenu);
    StudioAction studioAction = studioMenu.getStudioAction();
    if (studioAction != null) {
      studioAction.setName(menu.getName());
      studioAction.setArchived(studioMenu.getArchived());
      studioAction.setXmlId(studioMenu.getXmlId());
      studioAction.setTitle(menu.getTitle());
      studioAction.setStudioApp(studioMenu.getStudioApp());
      menu.setAction(studioActionService.build(studioAction));
    }

    MetaStore.clear();

    return menu;
  }

  @Override
  @SuppressWarnings("unchecked")
  public Optional<StudioAction> createStudioAction(MetaAction metaAction) {

    try {
      ObjectViews objectViews = XMLViews.fromXML(metaAction.getXml());
      List<Action> actions = objectViews.getActions();
      if (actions != null && !actions.isEmpty()) {
        ActionView action = (ActionView) actions.get(0);
        if (action.getModel() != null
            && action.getModel().contentEquals(MetaJsonRecord.class.getName())) {
          return Optional.empty();
        }
        StudioAction studioAction = new StudioAction(action.getName());
        studioAction.setTitle(action.getTitle());
        studioAction.setModel(action.getModel());
        studioAction.setTypeSelect(StudioActionRepository.TYPE_SELECT_VIEW);
        String domain = action.getDomain();
        studioAction.setDomainCondition(domain);
        action
            .getViews()
            .forEach(
                view -> {
                  StudioActionView studioActionView = new StudioActionView();
                  studioActionView.setViewType(view.getType());
                  studioActionView.setViewName(view.getName());
                  studioAction.addStudioActionView(studioActionView);
                });
        if (action.getParams() != null) {
          action
              .getParams()
              .forEach(
                  param -> {
                    StudioActionLine paramLine = new StudioActionLine();
                    paramLine.setName(param.getName());
                    paramLine.setValue(param.getValue());
                    studioAction.addViewParam(paramLine);
                  });
        }
        List<ActionView.Context> contextList = null;
        try {
          Mapper mapper = Mapper.of(ActionView.class);
          Field field = mapper.getBeanClass().getDeclaredField("contexts");
          field.setAccessible(true);
          if (field.get(action) != null) contextList = (List<ActionView.Context>) field.get(action);
        } catch (Exception e) {
          ExceptionHelper.trace(e);
        }

        if (!CollectionUtils.isEmpty(contextList)) {
          contextList.forEach(
              ctx -> {
                StudioActionLine ctxLine = new StudioActionLine();
                ctxLine.setName(ctx.getName());
                if (ctx.getName().contentEquals("jsonModel")
                    && domain != null
                    && domain.contains("self.jsonModel = :jsonModel")) {
                  studioAction.setIsJson(true);
                  studioAction.setModel(ctx.getExpression());
                }
                ctxLine.setValue(ctx.getExpression());
                studioAction.addLine(ctxLine);
              });
        }

        return Optional.of(studioAction);
      }
    } catch (JAXBException e) {
      ExceptionHelper.trace(e);
    }
    return Optional.empty();
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public StudioMenu updateStudioMenu(
      StudioMenu studioMenu,
      String objectName,
      String menuName,
      StudioApp studioApp,
      String objectClass,
      Boolean isJson,
      String domain) {

    if (StringUtils.isBlank(studioMenu.getName())) {
      studioMenu.setName(this.generateStudioMenuName(menuName));
    }

    if (StringUtils.isBlank(studioMenu.getXmlId())) {
      studioMenu.setXmlId(studioMenu.getName());
    }

    studioMenu.setStudioApp(studioApp);

    studioMenu.setShowAction(true);
    StudioAction studioAction = studioMenu.getStudioAction();
    if (studioAction == null) {
      studioAction = new StudioAction();
      studioAction.setXmlId(studioMenu.getName());
      studioAction.setName(studioMenu.getName());
    }
    studioAction.setTypeSelect(StudioActionRepository.TYPE_SELECT_VIEW);
    studioAction.setIsJson(isJson);
    studioAction.setModel(objectName);
    if (!Strings.isNullOrEmpty(domain)) {
      studioAction.setDomainCondition(domain);
    }
    addActionViews(studioAction, isJson, objectName, objectClass);

    studioMenu.setStudioAction(studioAction);

    return studioMenuRepo.save(studioMenu);
  }

  @Override
  public void addActionViews(
      StudioAction studioAction, Boolean isJson, String objectName, String objectClass) {

    String viewName;
    if (Boolean.TRUE.equals(isJson)) {
      viewName = "custom-model-" + objectName;
    } else {
      objectName = StringUtils.substringAfterLast(objectName, ".");
      viewName = Inflector.getInstance().dasherize(objectName);
    }
    this.setStudioActionView("grid", viewName + "-grid", studioAction);
    this.setStudioActionView("form", viewName + "-form", studioAction);
  }

  @Override
  public void setStudioActionView(String viewType, String viewName, StudioAction studioAction) {
    if (WrappingHelper.wrap(studioAction.getStudioActionViews()).stream()
        .filter(Objects::nonNull)
        .anyMatch(
            studioActionView ->
                viewType.equals(studioActionView.getViewType())
                    && viewName.equals(studioActionView.getViewName()))) {
      return;
    }

    StudioActionView studioActionView = new StudioActionView();
    studioActionView.setViewType(viewType);
    studioActionView.setViewName(viewName);
    studioAction.addStudioActionView(studioActionView);
  }

  @Override
  public String generateStudioMenuName(String name) {
    return "studio-menu-" + name.toLowerCase().replaceAll("[ ]+", "-");
  }

  @Override
  @CallMethod
  public String checkAndGenerateName(String name) {
    if (name == null) return "";
    name = name.replaceAll("[^a-zA-Z0-9-. ]", "");
    return Inflector.getInstance().dasherize(name.toLowerCase());
  }
}
