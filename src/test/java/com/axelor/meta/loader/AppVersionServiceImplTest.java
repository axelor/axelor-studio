/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.meta.loader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * This test class evaluates the method `findMaxVersion` from the `AppVersionServiceImpl` class. The
 * method is designed to find the maximum version string from a set of version strings that match a
 * specific version pattern.
 */
class AppVersionServiceImplTest {

  @Test
  void testFindMaxVersionWithValidVersions() {
    Set<String> versions = Set.of("1.2.3", "20.3.4", "3.4.5", "0.9.101");
    String result = AppVersionServiceImpl.findMaxVersion(versions);
    assertEquals("3.4.5", result);
  }

  @Test
  void testFindMaxVersionWithSingleVersion() {
    Set<String> versions = Set.of("2.3.4");
    String result = AppVersionServiceImpl.findMaxVersion(versions);
    assertEquals("2.3.4", result);
  }

  @Test
  void testFindMaxVersionWithEmptySet() {
    Set<String> versions = Set.of();
    String result = AppVersionServiceImpl.findMaxVersion(versions);
    assertNull(result);
  }

  @Test
  void testFindMaxVersionWithNonMatchingVersions() {
    Set<String> versions = Set.of("alpha", "beta", "gamma");
    String result = AppVersionServiceImpl.findMaxVersion(versions);
    assertNull(result);
  }

  @Test
  void testFindMaxVersionWithMixedVersions() {
    Set<String> versions = Set.of("1.2.alpha", "2.3.4", "3.4.5.beta");
    String result = AppVersionServiceImpl.findMaxVersion(versions);
    assertEquals("3.4.5", result);
  }

  @Test
  void testFindMaxVersionWithSnapshots() {
    Set<String> versions = Set.of("1.2.3", "2.3.4", "3.4.5-SNAPSHOT");
    String result = AppVersionServiceImpl.findMaxVersion(versions);
    assertEquals("3.4.5", result);
  }
}
