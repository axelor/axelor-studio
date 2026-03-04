/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import com.axelor.studio.db.StudioApp;
import java.io.File;
import java.io.IOException;
import java.util.List;

public interface StudioAppUpdateCleanupService {

  List<String> detectObsoleteElements(File dataDir, StudioApp studioApp) throws IOException;

  List<String> detachObsoleteElements(File dataDir, StudioApp studioApp) throws IOException;
}
