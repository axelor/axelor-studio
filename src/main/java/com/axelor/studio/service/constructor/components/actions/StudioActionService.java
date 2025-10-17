/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.actions;

import com.axelor.meta.db.MetaAction;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionView;
import com.google.inject.persist.Transactional;
import java.io.IOException;
import java.util.List;

public interface StudioActionService {

  @Transactional(rollbackOn = Exception.class)
  MetaAction build(StudioAction studioAction) throws IOException, ClassNotFoundException;

  StudioAction setStudioActionViews(
      StudioAction studioAction, String modelName, String formViewName, String gridViewName);

  void setStudioActionView(
      String viewType, String viewName, List<StudioActionView> studioActionViews);
}
