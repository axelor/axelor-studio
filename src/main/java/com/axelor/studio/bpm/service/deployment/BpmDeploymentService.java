/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.studio.bpm.dto.DeploymentResult;
import com.axelor.studio.db.WkfModel;

public interface BpmDeploymentService {

  DeploymentResult deploy(WkfModel targetModel);
}
