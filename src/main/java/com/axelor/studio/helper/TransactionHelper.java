package com.axelor.studio.helper;

import com.axelor.db.JPA;
import java.util.concurrent.Callable;

public class TransactionHelper {
  public static <T> T runInTransaction(boolean txnStartExtraCondition, Callable<T> callable) {
    var txn = JPA.em().getTransaction();
    var txnStarted = false;
    try {
      if (!txn.isActive() && txnStartExtraCondition) {
        txn.begin();
        txnStarted = true;
      }
      var result = callable.call();
      if (txnStarted && txn.isActive() && !txn.getRollbackOnly()) txn.commit();
      return result;
    } catch (Exception e) {
      if (txnStarted && txn.isActive()) txn.rollback();
      throw new IllegalStateException(e);
    } finally {
      if (txnStarted && txn.isActive()) txn.rollback();
    }
  }
}
