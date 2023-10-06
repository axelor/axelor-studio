package com.axelor.studio.service.builder;

import com.axelor.meta.db.MetaAction;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionView;
import com.google.inject.persist.Transactional;
import java.util.List;

public interface StudioActionService {

  @Transactional(rollbackOn = Exception.class)
  MetaAction build(StudioAction studioAction);

  StudioAction setStudioActionViews(
      StudioAction studioAction, String modelName, String formViewName, String gridViewName);

  void setStudioActionView(
      String viewType, String viewName, List<StudioActionView> studioActionViews);
}
