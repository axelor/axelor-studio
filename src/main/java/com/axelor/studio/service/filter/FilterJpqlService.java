/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.Filter;
import java.util.List;

public interface FilterJpqlService {

  String getJpqlFilters(List<Filter> filterList);

  String getJsonJpql(MetaJsonField jsonField);
}
