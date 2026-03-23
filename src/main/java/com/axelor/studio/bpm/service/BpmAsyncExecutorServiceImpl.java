/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Singleton;
import jakarta.inject.Inject;
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
    pool.close();
    log.info("BPM async ForkJoinPool shut down");
  }
}
