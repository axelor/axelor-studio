/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.service;

import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.lang.invoke.MethodHandles;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class BpmAsyncExecutorServiceImpl implements BpmAsyncExecutorService {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String THREAD_NAME_PREFIX = "bpm-async-";

  private final ForkJoinPool pool;

  @Inject
  public BpmAsyncExecutorServiceImpl(AppSettingsStudioService appSettingsStudioService) {
    int parallelism = appSettingsStudioService.bpmAsyncPoolParallelism();

    AtomicInteger threadCount = new AtomicInteger(0);
    ForkJoinPool.ForkJoinWorkerThreadFactory threadFactory =
        fjPool -> {
          ForkJoinWorkerThread t =
              ForkJoinPool.defaultForkJoinWorkerThreadFactory.newThread(fjPool);
          t.setName(THREAD_NAME_PREFIX + threadCount.incrementAndGet());
          t.setDaemon(true);
          return t;
        };

    this.pool = new ForkJoinPool(parallelism, threadFactory, null, true);

    log.info("BPM async ForkJoinPool initialized: parallelism={}", parallelism);
  }

  @Override
  public Future<?> submit(Runnable task) {
    return pool.submit(task);
  }

  @Override
  public void shutdown() {
    log.info("Shutting down BPM async ForkJoinPool...");
    pool.shutdown();
    log.info("BPM async ForkJoinPool shut down");
  }
}
