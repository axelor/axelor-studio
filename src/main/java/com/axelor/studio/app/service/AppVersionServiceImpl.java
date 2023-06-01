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
package com.axelor.studio.app.service;

import com.axelor.meta.db.MetaModule;
import com.axelor.meta.db.repo.MetaModuleRepository;
import com.axelor.studio.db.App;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;

public class AppVersionServiceImpl implements AppVersionService {

  protected static final String VERSION_PATTERN = "(\\d(\\.\\d)+)+";

  protected MetaModuleRepository metaModuleRepo;

  @Inject
  public AppVersionServiceImpl(MetaModuleRepository metaModuleRepo) {
    this.metaModuleRepo = metaModuleRepo;
  }

  @Override
  public String getAppVersion(App app) {
    if (StringUtils.isEmpty(app.getModules())) {
      return null;
    }

    String[] modulesArr = app.getModules().split(",");
    List<String> versions = new ArrayList<>();
    Pattern pattern = Pattern.compile(VERSION_PATTERN);

    for (String moduleName : modulesArr) {
      MetaModule module = metaModuleRepo.findByName(moduleName);
      if (module == null) {
        continue;
      }
      Matcher matcher = pattern.matcher(module.getModuleVersion());
      if (matcher.find()) {
        versions.add(matcher.group(1));
      }
    }

    if (versions.isEmpty()) {
      return null;
    }

    Collections.sort(versions, Collections.reverseOrder());
    return versions.get(0).toString();
  }
}
