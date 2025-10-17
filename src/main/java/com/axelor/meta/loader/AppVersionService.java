/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.meta.loader;

import com.axelor.studio.db.App;

public interface AppVersionService {

  String getAppVersion(App app);
}
