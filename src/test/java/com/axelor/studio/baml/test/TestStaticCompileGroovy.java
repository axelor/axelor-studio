/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.test;

import com.axelor.auth.db.User;
import com.axelor.rpc.Context;
import com.axelor.script.GroovyScriptHelper;
import org.junit.jupiter.api.Test;

class TestStaticCompileGroovy {

  @Test
  void test() {
    String script =
        """
        import com.axelor.auth.db.User

        void execute(){
          User user = new User()
          user.code = 'abc'
          def x = user
          println(x.code)
        }

        execute()
        """;
    Context ctx = new Context(User.class);
    GroovyScriptHelper helper = new GroovyScriptHelper(ctx);
    helper.eval(script);
  }
}
