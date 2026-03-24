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
package com.axelor.studio.db.repo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.db.Model;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.BpmAsyncExecutorService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.helper.TransactionHelper;
import com.axelor.studio.service.AppSettingsStudioService;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

class GlobalEntityListenerTest {

  @AfterEach
  void tearDown() {
    GlobalEntityListener.BPM_DEPTH.remove();
  }

  @Test
  void onPostPersistOrUpdate_shouldSkip_whenEngineNotInitialized() {
    GlobalEntityListener listener = new GlobalEntityListener();
    Model model = mock(Model.class);
    when(model.getId()).thenReturn(1L);

    ProcessEngineService engineService = mock(ProcessEngineService.class);
    when(engineService.isInitialized()).thenReturn(false);

    try (MockedStatic<Beans> beansMock = mockStatic(Beans.class);
        MockedStatic<TransactionHelper> txMock = mockStatic(TransactionHelper.class)) {

      beansMock.when(() -> Beans.get(ProcessEngineService.class)).thenReturn(engineService);

      listener.onPostPersistOrUpdate(model);

      txMock.verify(() -> TransactionHelper.runAfterCommit(any()), never());
    }
  }

  @Test
  void onPostPersistOrUpdate_shouldSkip_whenMaxDepthReached() {
    GlobalEntityListener listener = new GlobalEntityListener();
    Model model = mock(Model.class);
    when(model.getId()).thenReturn(1L);

    ProcessEngineService engineService = mock(ProcessEngineService.class);
    when(engineService.isInitialized()).thenReturn(true);

    AppSettingsStudioService settings = mock(AppSettingsStudioService.class);
    when(settings.bpmMaxReentranceDepth()).thenReturn(2);

    GlobalEntityListener.BPM_DEPTH.set(2);

    try (MockedStatic<Beans> beansMock = mockStatic(Beans.class);
        MockedStatic<TransactionHelper> txMock = mockStatic(TransactionHelper.class)) {

      beansMock.when(() -> Beans.get(ProcessEngineService.class)).thenReturn(engineService);
      beansMock.when(() -> Beans.get(AppSettingsStudioService.class)).thenReturn(settings);

      listener.onPostPersistOrUpdate(model);

      txMock.verify(() -> TransactionHelper.runAfterCommit(any()), never());
    }
  }

  @Test
  void onPostPersistOrUpdate_shouldProceed_whenDepthBelowMax() {
    GlobalEntityListener listener = new GlobalEntityListener();
    Model model = mock(Model.class);
    when(model.getId()).thenReturn(1L);

    ProcessEngineService engineService = mock(ProcessEngineService.class);
    when(engineService.isInitialized()).thenReturn(true);

    AppSettingsStudioService settings = mock(AppSettingsStudioService.class);
    when(settings.bpmMaxReentranceDepth()).thenReturn(32);

    GlobalEntityListener.BPM_DEPTH.set(0);

    try (MockedStatic<Beans> beansMock = mockStatic(Beans.class);
        MockedStatic<TransactionHelper> txMock = mockStatic(TransactionHelper.class)) {

      beansMock.when(() -> Beans.get(ProcessEngineService.class)).thenReturn(engineService);
      beansMock.when(() -> Beans.get(AppSettingsStudioService.class)).thenReturn(settings);

      listener.onPostPersistOrUpdate(model);

      txMock.verify(() -> TransactionHelper.runAfterCommit(any()));
    }
  }

  @Test
  void runOnSeparateThread_shouldSubmitTaskToAsyncService() throws InterruptedException {
    GlobalEntityListener listener = new GlobalEntityListener();
    var latch = new CountDownLatch(1);

    BpmAsyncExecutorService asyncService = mock(BpmAsyncExecutorService.class);
    when(asyncService.submit(any(Runnable.class)))
        .thenAnswer(
            invocation -> {
              // Execute the task inline and count down to unblock managedBlock
              Runnable task = invocation.getArgument(0);
              task.run();
              latch.countDown();
              return mock(Future.class);
            });

    GlobalEntityListener.BPM_DEPTH.set(3);

    try (MockedStatic<Beans> beansMock = mockStatic(Beans.class)) {
      beansMock.when(() -> Beans.get(BpmAsyncExecutorService.class)).thenReturn(asyncService);

      // runOnSeparateThread blocks on managedBlock until latch counts down
      // The mock above runs the task inline which counts down the latch
      // But the task calls callWkfProcess which will fail — that's expected
      // We just verify submit was called
      try {
        listener.runOnSeparateThread(new GlobalEntityListener.EntityRef("com.example.Test", 1L));
      } catch (Exception e) {
        // Expected: callWkfProcess will fail without real DB/context
      }

      verify(asyncService).submit(any(Runnable.class));
    }
  }

  @Test
  void bpmDepth_threadLocal_shouldBeIsolatedBetweenThreads() throws InterruptedException {
    GlobalEntityListener.BPM_DEPTH.set(5);

    var otherThreadDepth = new AtomicInteger(-1);
    var latch = new CountDownLatch(1);

    Thread otherThread =
        new Thread(
            () -> {
              otherThreadDepth.set(GlobalEntityListener.BPM_DEPTH.get());
              latch.countDown();
            });
    otherThread.start();

    latch.await(5, TimeUnit.SECONDS);
    assertEquals(5, GlobalEntityListener.BPM_DEPTH.get());
    assertEquals(0, otherThreadDepth.get());
  }

  @Test
  void onPostPersistOrUpdate_shouldAllowDepthBelowMax() {
    GlobalEntityListener listener = new GlobalEntityListener();
    Model model = mock(Model.class);
    when(model.getId()).thenReturn(1L);

    ProcessEngineService engineService = mock(ProcessEngineService.class);
    when(engineService.isInitialized()).thenReturn(true);

    AppSettingsStudioService settings = mock(AppSettingsStudioService.class);
    when(settings.bpmMaxReentranceDepth()).thenReturn(5);

    GlobalEntityListener.BPM_DEPTH.set(4);

    try (MockedStatic<Beans> beansMock = mockStatic(Beans.class);
        MockedStatic<TransactionHelper> txMock = mockStatic(TransactionHelper.class)) {

      beansMock.when(() -> Beans.get(ProcessEngineService.class)).thenReturn(engineService);
      beansMock.when(() -> Beans.get(AppSettingsStudioService.class)).thenReturn(settings);

      listener.onPostPersistOrUpdate(model);

      txMock.verify(() -> TransactionHelper.runAfterCommit(any()));
    }
  }

  @Test
  void entityRef_shouldStoreClassNameAndId() {
    var ref = new GlobalEntityListener.EntityRef("com.axelor.test.MyModel", 42L);

    assertEquals("com.axelor.test.MyModel", ref.getClassName());
    assertEquals(42L, ref.getId());
  }
}
