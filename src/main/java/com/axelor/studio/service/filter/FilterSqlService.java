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
package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.studio.db.Filter;
import java.util.List;

public interface FilterSqlService {

  public String getColumn(String model, String field);

  public String getColumn(MetaField metaField);

  public String getSqlType(String type);

  public String getSqlFilters(List<Filter> filterList, List<String> joins, boolean checkJson);

  public String[] getSqlField(Object target, String source, List<String> joins);

  public String[] getDefaultTarget(String fieldName, String modelName);

  public String[] getDefaultTargetJson(String fieldName, MetaJsonModel targetModel);

  public Object getTargetField(
      StringBuilder parent, Filter filter, List<String> joins, boolean checkJson);

  public String getTargetType(Object target);

  public Object parseMetaField(
      MetaField field, String target, List<String> joins, StringBuilder parent, boolean checkJson);

  public Object parseJsonField(
      MetaJsonField field, String target, List<String> joins, StringBuilder parent);

  public MetaField findMetaField(String name, String model);

  public MetaJsonField findJsonField(String name, String model);
}
