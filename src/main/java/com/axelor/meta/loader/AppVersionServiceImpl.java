/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2025 Axelor (<http://axelor.com>).
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
package com.axelor.meta.loader;

import com.axelor.studio.db.App;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;

/**
 * This class is defined in this AOP package to access to {@link Module} {@link ModuleResolver}
 * classes which have package visibility.
 */
public class AppVersionServiceImpl implements AppVersionService {

  /**
   * Pattern to match semantic version numbers (e.g., 10.1.0, 2.3.4.5).
   *
   * <p>Structure:
   *
   * <ul>
   *   <li>One or more digits (\d+)
   *   <li>Followed by one or more groups of:
   *       <ul>
   *         <li>A dot and one or more digits (\.\d+)
   *       </ul>
   * </ul>
   */
  protected static final String VERSION_PATTERN = "(\\d+(\\.\\d+)+)";

  private static final List<Module> MODULES = ModuleResolver.scan().all();

  @Override
  public String getAppVersion(App app) {
    String appModules = app.getModules();
    if (StringUtils.isEmpty(appModules)) {
      return null;
    }

    Set<String> versions =
        Arrays.stream(appModules.split(","))
            .map(this::findModuleByName)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(Module::getVersion)
            .collect(Collectors.toSet());
    return findMaxVersion(versions);
  }

  private Optional<Module> findModuleByName(String appModule) {
    return MODULES.stream().filter(module -> module.getName().equals(appModule)).findAny();
  }

  protected static String findMaxVersion(Set<String> versions) {
    Pattern pattern = Pattern.compile(VERSION_PATTERN);
    return versions.stream()
        .map(pattern::matcher)
        .filter(Matcher::find)
        .map(matcher -> matcher.group(1))
        .max(Comparator.naturalOrder())
        .orElse(null);
  }
}
