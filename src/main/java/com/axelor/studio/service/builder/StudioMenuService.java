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

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaMenu;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioMenu;
import java.util.Optional;

public interface StudioMenuService {

  public MetaMenu build(StudioMenu studioMenu);

  public Optional<StudioAction> createStudioAction(MetaAction metaAction);

  public StudioMenu updateStudioMenu(
      StudioMenu studioMenu,
      String objectName,
      String menuName,
      StudioApp studioApp,
      String objectClass,
      Boolean isJson,
      String domain);

  @CallMethod
  public String checkAndGenerateName(String name);
}
