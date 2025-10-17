/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import java.util.Map;

public interface ChartRecordViewService {

  Map<String, Object> getActionView(String chartName, Map<String, Object> context);
}
