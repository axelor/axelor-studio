package com.axelor.studio.bpm.service.deployment;

import com.axelor.auth.db.User;
import com.axelor.studio.db.WkfTaskConfig;
import java.util.List;

public interface WkfMenuService {

  public static final String MENU_PREFIX = "wkf-node-menu-";
  public static final String USER_MENU_PREFIX = "wkf-node-user-menu-";

  public void createOrUpdateMenu(WkfTaskConfig wkfTaskConfig);

  public void createOrUpdateUserMenu(WkfTaskConfig wkfTaskConfig);

  public String getModelName(WkfTaskConfig wkfTaskConfig);

  public void removeMenu(WkfTaskConfig wkfTaskConfig);

  public void removeUserMenu(WkfTaskConfig wkfTaskConfig);

  public void removeAction(String menuName);

  public List<Long> getTeamIds(User user);
}
