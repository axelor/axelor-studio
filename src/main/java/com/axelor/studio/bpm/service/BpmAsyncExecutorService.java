/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import java.util.concurrent.Future;

public interface BpmAsyncExecutorService {
  Future<?> submit(Runnable task);

  void shutdown();
}
