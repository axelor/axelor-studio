/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.helper;

import com.axelor.db.Model;

public final class ModelTools {

  private ModelTools() {}

  public static Class<? extends Model> findModelClass(String fullName) {
    try {
      Class<?> modelClass = Class.forName(fullName);
      return modelClass.asSubclass(Model.class);
    } catch (ClassNotFoundException e) {
      throw new IllegalStateException(e);
    }
  }
}
