package com.axelor.studio.service.builder;

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaMenu;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioMenu;
import com.google.inject.persist.Transactional;
import java.util.Optional;

public interface StudioMenuService {

  @Transactional(rollbackOn = Exception.class)
  MetaMenu build(StudioMenu studioMenu);

  @SuppressWarnings("unchecked")
  Optional<StudioAction> createStudioAction(MetaAction metaAction);

  @Transactional(rollbackOn = Exception.class)
  StudioMenu updateStudioMenu(
      StudioMenu studioMenu,
      String objectName,
      String menuName,
      StudioApp studioApp,
      String objectClass,
      Boolean isJson,
      String domain);

  void addActionViews(
      StudioAction studioAction, Boolean isJson, String objectName, String objectClass);

  void setStudioActionView(String viewType, String viewName, StudioAction studioAction);

  String generateStudioMenuName(String name);

  @CallMethod
  String checkAndGenerateName(String name);
}
