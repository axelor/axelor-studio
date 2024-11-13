package com.axelor.studio.ls.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Annotation to mark a static method as a function that can be called from a LinkScript. */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD})
public @interface LinkScriptFunction {
  /**
   * @return the name that must be used to call the function from a LinkScript.
   */
  String value();
}
