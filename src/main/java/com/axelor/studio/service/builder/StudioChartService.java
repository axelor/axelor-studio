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
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.StudioChart;
import javax.xml.bind.JAXBException;

public interface StudioChartService {

  public void build(StudioChart studioChart) throws JAXBException;

  @CallMethod
  public String getDefaultTarget(MetaField metaField);

  @CallMethod
  public String getDefaultTarget(MetaJsonField metaJsonField);

  @CallMethod
  public String getTargetType(Object object, String target);
}
