/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.actions;

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaAction;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.StudioAction;
import jakarta.mail.MessagingException;

public interface StudioActionEmailService {

  MetaAction build(StudioAction studioAction);

  @CallMethod
  ActionResponse sendEmail(Long objectId, String model, String tag, Long templateId, int sendOption)
      throws ClassNotFoundException, MessagingException;
}
