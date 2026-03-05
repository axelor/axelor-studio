/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.studio.exception.StudioExceptionMessage;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioAppDetachHelper {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public <T extends Model> int detachEntities(
      JpaRepository<T> repository,
      String dbFilter,
      Long appId,
      Function<T, String> keyExtractor,
      Consumer<T> detacher,
      Set<String> zipKeys,
      Class<T> entityClass,
      List<String> detachLog) {

    Objects.requireNonNull(zipKeys, "zipKeys must not be null");

    List<T> existingEntities = repository.all().filter(dbFilter).bind("appId", appId).fetch();
    int detached = 0;

    for (T entity : existingEntities) {
      String entityKey = keyExtractor.apply(entity);
      if (entityKey != null && !zipKeys.contains(entityKey)) {
        String logEntry =
            String.format(
                I18n.get(StudioExceptionMessage.ELEMENT_DETACHED),
                entityClass.getSimpleName(),
                entityKey);
        log.info(logEntry);
        detachLog.add(logEntry);
        detacher.accept(entity);
        repository.save(entity);
        detached++;
      }
    }

    return detached;
  }
}
