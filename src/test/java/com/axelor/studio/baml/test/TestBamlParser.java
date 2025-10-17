/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.test;

import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.rpc.Criteria;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class TestBamlParser {

  @Test
  void testJsonQuery() {
    Map<String, Object> rawCriteria = new HashMap<>();

    Map<String, Object> _domainContext = new HashMap<>();
    _domainContext.put("jsonModel", "File");

    rawCriteria.put("fieldName", "attrs.integer1");
    rawCriteria.put("operator", "=");
    rawCriteria.put("value", 2);
    rawCriteria.put("_domain", "jsonModel = :jsonModel");
    rawCriteria.put("_domainContext", _domainContext);

    Criteria criteria = Criteria.parse(rawCriteria, MetaJsonRecord.class, false);
    criteria.createQuery(MetaJsonRecord.class).toString();
    System.err.println(criteria);
    System.err.println(criteria.createQuery(MetaJsonRecord.class).toString());
  }
}
