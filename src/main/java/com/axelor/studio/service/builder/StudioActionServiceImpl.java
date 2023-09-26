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

import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaAction;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionView;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioActionServiceImpl implements StudioActionService {

  protected final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected StudioActionViewService studioActionViewService;

  protected StudioActionScriptServiceImpl studioActionScriptService;

  protected StudioActionEmailService studioActionEmailService;

  @Inject
  public StudioActionServiceImpl(
      StudioActionViewService studioActionViewService,
      StudioActionScriptServiceImpl studioActionScriptService,
      StudioActionEmailService studioActionEmailService) {
    this.studioActionViewService = studioActionViewService;
    this.studioActionEmailService = studioActionEmailService;
    this.studioActionScriptService = studioActionScriptService;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public MetaAction build(StudioAction studioAction) {

    if (studioAction == null) {
      return null;
    }

    log.debug(
        "Processing action: {}, type: {}", studioAction.getName(), studioAction.getTypeSelect());

    if (Arrays.asList(
                StudioActionRepository.TYPE_SELECT_CREATE,
                StudioActionRepository.TYPE_SELECT_UPDATE)
            .contains(studioAction.getTypeSelect())
        && (studioAction.getLines() == null || studioAction.getLines().isEmpty())) {
      return null;
    }

    MetaAction metaAction = null;
    switch (studioAction.getTypeSelect()) {
      case StudioActionRepository.TYPE_SELECT_CREATE:
        metaAction = studioActionScriptService.build(studioAction);
        break;
      case StudioActionRepository.TYPE_SELECT_UPDATE:
        metaAction = studioActionScriptService.build(studioAction);
        break;
      case StudioActionRepository.TYPE_SELECT_SCRIPT:
        metaAction = studioActionScriptService.build(studioAction);
        break;
      case StudioActionRepository.TYPE_SELECT_VIEW:
        metaAction = studioActionViewService.build(studioAction);
        break;
      case StudioActionRepository.TYPE_SELECT_EMAIL:
        metaAction = studioActionEmailService.build(studioAction);
    }

    if (studioAction.getMetaModule() != null) {
      metaAction.setModule(studioAction.getMetaModule().getName());
    }

    if (studioAction.getMenuAction()) {
      metaAction.setArchived(studioAction.getArchived());
    }

    MetaStore.clear();

    return metaAction;
  }

  @Override
  public StudioAction setStudioActionViews(
      StudioAction studioAction, String modelName, String formViewName, String gridViewName) {
    if (studioAction.getStudioActionViews() == null) {
      studioAction.setStudioActionViews(new ArrayList<>());
    }
    List<StudioActionView> studioActionViews = studioAction.getStudioActionViews();
    if (formViewName != null) {
      setStudioActionView("form", formViewName, studioActionViews);
    }
    if (gridViewName != null) {
      setStudioActionView("grid", gridViewName, studioActionViews);
    }

    studioAction.setModel(modelName);
    return studioAction;
  }

  @Override
  public void setStudioActionView(
      String viewType, String viewName, List<StudioActionView> studioActionViews) {
    StudioActionView studioActionView = new StudioActionView();
    studioActionView.setViewType(viewType);
    studioActionView.setViewName(viewName);
    studioActionViews.add(studioActionView);
  }
}
