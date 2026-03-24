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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.studio.service.AppSettingsStudioService;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BpmAsyncExecutorServiceImplTest {

  private BpmAsyncExecutorServiceImpl service;

  @BeforeEach
  void setUp() {
    AppSettingsStudioService settings = mock(AppSettingsStudioService.class);
    when(settings.bpmAsyncPoolParallelism()).thenReturn(1);
    service = new BpmAsyncExecutorServiceImpl(settings);
  }

  @AfterEach
  void tearDown() {
    if (service != null) {
      service.shutdown();
    }
  }

  @Test
  void submit_shouldExecuteTask() throws InterruptedException {
    var latch = new CountDownLatch(1);

    service.submit(latch::countDown);

    assertTrue(latch.await(5, TimeUnit.SECONDS));
  }

  @Test
  void submit_shouldReturnFuture() {
    Future<?> future = service.submit(() -> {});

    assertNotNull(future);
  }

  @Test
  void submit_shouldUseNamedDaemonThreads() throws InterruptedException {
    var threadName = new AtomicReference<String>();
    var threadDaemon = new AtomicReference<Boolean>();
    var latch = new CountDownLatch(1);

    service.submit(
        () -> {
          threadName.set(Thread.currentThread().getName());
          threadDaemon.set(Thread.currentThread().isDaemon());
          latch.countDown();
        });

    assertTrue(latch.await(5, TimeUnit.SECONDS));
    assertTrue(threadName.get().startsWith("bpm-async-"));
    assertTrue(threadDaemon.get());
  }

  @Test
  void shutdown_shouldTerminatePool() throws Exception {
    service.shutdown();

    var field = BpmAsyncExecutorServiceImpl.class.getDeclaredField("pool");
    field.setAccessible(true);
    var pool = (java.util.concurrent.ForkJoinPool) field.get(service);

    assertTrue(pool.isTerminated());
    service = null; // prevent double shutdown in tearDown
  }

  @Test
  void shutdown_shouldNotThrow() {
    assertDoesNotThrow(() -> service.shutdown());
    service = null;
  }

  @Test
  void submit_shouldExecuteMultipleTasks() throws InterruptedException {
    int taskCount = 5;
    var latch = new CountDownLatch(taskCount);

    for (int i = 0; i < taskCount; i++) {
      service.submit(latch::countDown);
    }

    assertTrue(latch.await(10, TimeUnit.SECONDS));
  }
}
