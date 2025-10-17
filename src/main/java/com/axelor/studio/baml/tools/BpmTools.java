/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.tools;

import com.axelor.db.tenants.TenantConfig;
import com.axelor.db.tenants.TenantResolver;
import java.util.Optional;

public abstract class BpmTools {

  private BpmTools() {
    throw new IllegalAccessError("Utility class");
  }

  public static String getCurrentTenant() {
    return Optional.ofNullable(TenantResolver.currentTenantIdentifier())
        .orElse(TenantConfig.DEFAULT_TENANT_ID);
  }
}
