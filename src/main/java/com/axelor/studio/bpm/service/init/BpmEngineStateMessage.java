/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import java.io.Serializable;

/** Message published via Redis pub/sub when BPM app state changes across instances. */
public class BpmEngineStateMessage implements Serializable {

  private static final long serialVersionUID = 1L;

  private String tenantId;
  private boolean active;
  private String sourceInstanceId;

  private BpmEngineStateMessage() {}

  public BpmEngineStateMessage(String tenantId, boolean active, String sourceInstanceId) {
    this.tenantId = tenantId;
    this.active = active;
    this.sourceInstanceId = sourceInstanceId;
  }

  public String getTenantId() {
    return tenantId;
  }

  public boolean isActive() {
    return active;
  }

  public String getSourceInstanceId() {
    return sourceInstanceId;
  }

  @Override
  public String toString() {
    return String.format(
        "BpmEngineStateMessage{tenantId='%s', active=%s, source='%s'}",
        tenantId, active, sourceInstanceId);
  }
}
