package com.axelor.studio.bpm.service.deployment;

import com.axelor.auth.db.User;
import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaMenu;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.google.inject.persist.Transactional;
import java.util.List;
import java.util.Map;

public interface WkfMenuService {

  String MENU_PREFIX = "wkf-node-menu-";
  String USER_MENU_PREFIX = "wkf-node-user-menu-";

  @Transactional(rollbackOn = Exception.class)
  void createOrUpdateMenu(WkfTaskConfig wkfTaskConfig);

  MetaMenu findOrCreateMenu(String name);

  @Transactional(rollbackOn = Exception.class)
  MetaAction createOrUpdateAction(
      MetaMenu metaMenu, WkfTaskConfig wkfTaskConfig, WkfTaskMenu taskMenu);

  Map<String, String> getViewNames(
      WkfTaskConfig wkfTaskConfig, WkfTaskMenu taskMenu, boolean isJson);

  String createQuery(
      WkfTaskConfig wkfTaskConfig, WkfTaskMenu taskMenu, boolean userMenu, boolean isJson);

  String getViewPrefix(WkfTaskConfig wkfTaskConfig, boolean isJson);

  String getModelName(WkfTaskConfig wkfTaskConfig);

  @Transactional(rollbackOn = Exception.class)
  void removeMenu(WkfTaskConfig wkfTaskConfig);

  @Transactional(rollbackOn = Exception.class)
  void removeMenu(WkfTaskMenu taskMenu);

  @Transactional(rollbackOn = Exception.class)
  void removeAction(String menuName);

  @CallMethod
  List<Long> getTeamIds(User user);
}
