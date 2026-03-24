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
package com.axelor.studio.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.app.AppSettings;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AppSettingsStudioServiceImplTest {

  private AppSettingsStudioServiceImpl service;
  private AppSettings appSettings;

  @BeforeEach
  void setUp() throws Exception {
    service = new AppSettingsStudioServiceImpl();
    appSettings = mock(AppSettings.class);

    // AppSettings is inherited from AppSettingsMessageServiceImpl -> AppSettingsBaseServiceImpl
    // which stores it in the 'appSettings' field
    setField(service, "appSettings", appSettings);
  }

  @Test
  void bpmMaxReentranceDepth_shouldDefaultTo32() {
    when(appSettings.getInt("studio.bpm.max.reentrance.depth", 32)).thenReturn(32);

    assertEquals(32, service.bpmMaxReentranceDepth());
  }

  @Test
  void bpmMaxReentranceDepth_shouldReturnConfiguredValue() {
    when(appSettings.getInt("studio.bpm.max.reentrance.depth", 32)).thenReturn(10);

    assertEquals(10, service.bpmMaxReentranceDepth());
  }

  @Test
  void bpmAsyncPoolParallelism_shouldReturnAtLeast1() {
    int cpus = Runtime.getRuntime().availableProcessors();
    int defaultValue = Math.max(1, cpus);
    when(appSettings.getInt("studio.bpm.async.pool.parallelism", defaultValue))
        .thenReturn(defaultValue);

    int result = service.bpmAsyncPoolParallelism();

    assertTrue(result >= 1);
  }

  @Test
  void bpmAsyncPoolParallelism_shouldReturnConfiguredValue() {
    int cpus = Runtime.getRuntime().availableProcessors();
    int defaultValue = Math.max(1, cpus);
    when(appSettings.getInt("studio.bpm.async.pool.parallelism", defaultValue)).thenReturn(4);

    assertEquals(4, service.bpmAsyncPoolParallelism());
  }

  private void setField(Object target, String name, Object value) throws Exception {
    Class<?> clazz = target.getClass();
    while (clazz != null) {
      try {
        var field = clazz.getDeclaredField(name);
        field.setAccessible(true);
        field.set(target, value);
        return;
      } catch (NoSuchFieldException e) {
        clazz = clazz.getSuperclass();
      }
    }
    throw new NoSuchFieldException(name + " not found in hierarchy of " + target.getClass());
  }
}
