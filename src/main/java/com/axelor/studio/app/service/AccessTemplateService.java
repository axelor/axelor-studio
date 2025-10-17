/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.app.service;

import com.axelor.meta.db.MetaFile;
import java.io.IOException;

public interface AccessTemplateService {

  MetaFile generateTemplate() throws IOException;
}
