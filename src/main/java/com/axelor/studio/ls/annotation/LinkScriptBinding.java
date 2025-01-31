package com.axelor.studio.ls.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark a static no parameter method or a class as a context binding inside
 * LinkScripts.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface LinkScriptBinding {
  /**
   * @return the name that must be used to access the binding value in the LinkScript context.
   */
  String value();
}
