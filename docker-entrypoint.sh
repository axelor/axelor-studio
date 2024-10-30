#!/bin/sh

APP_USER="${APP_USER:-admin}"
APP_PASS="${APP_PASS:-admin}"

PGHOST="${PGHOST:-postgres}"
PGUSER="${PGUSER:-axelor}"
PGPASSWORD="${PGPASSWORD:-axelor}"
PGDATABASE="${PGDATABASE:-axelor}"

APP_LANGUAGE="${APP_LANGUAGE:-en}"
APP_DEMO_DATA="${APP_DEMO_DATA:-false}"
APP_LOAD_APPS="${APP_LOAD_APPS:-all}"
DEV_MODE="${DEV_MODE:-false}"
ENABLE_QUARTZ="${ENABLE_QUARTZ:-false}"
CLEAN_DB="${CLEAN_DB:-false}"
ENV_SHORT="${ENV_SHORT:-int}"

APP_DATA_BASE_DIR="/data"
APP_DATA_EXPORTS_DIR="${APP_DATA_EXPORTS_DIR:-$APP_DATA_BASE_DIR/exports}"
APP_DATA_ATTACHMENTS_DIR="${APP_DATA_ATTACHMENTS_DIR:-$APP_DATA_BASE_DIR/attachments}"

mkdir -p ${APP_DATA_EXPORTS_DIR} ${APP_DATA_ATTACHMENTS_DIR}

init_tomcat() {
  echo "Configuring app:tomcat 🔧"
  TOMCAT_SERVER_PATH=${CATALINA_HOME}/conf/server.xml

  # Remove localhost_access_log
  sed -i -E -e ':a' -e 'N' -e '$!ba' -e 's|<Valve className="org.apache.catalina.valves.AccessLogValve"(.\|\n)*/>||' ${TOMCAT_SERVER_PATH}
}

wait_for_postgres() {
  retries=5
  until psql --command "SELECT 1" > /dev/null 2>&1 || [ ${retries} -eq 0 ]; do
    echo "Waiting for postgres server, ${retries} remaining attempts..."
    retries=$((retries-1))
    sleep 3
  done

  if [ ${retries} -eq 0 ]; then
    echo "Impossible to contact PostgreSQL"
  else
    echo "Postgresql Ready"
  fi
}

init_postgres() {
  if [ -z "`psql -t --command "SELECT extname FROM pg_extension WHERE extname = 'unaccent'"`" ]; then
    echo "Configuring app:database 🔧"
    psql --command "CREATE EXTENSION IF NOT EXISTS unaccent"
  fi
}

update_properties() {
  echo "Configuring app:properties 🔧"

  APP_PROP_FILE_PATH="${CATALINA_HOME}/webapps/ROOT/WEB-INF/classes/axelor-config.properties"
  APP_MODE="prod"
  LOG_LEVEL="INFO"
  if [ "${DEV_MODE}" = "true" ]; then
    APP_MODE="dev"
    LOG_LEVEL="DEBUG"
  fi

  findAndReplace "studio.apps.install" "${APP_LOAD_APPS}" ${APP_PROP_FILE_PATH}
  findAndReplace "application.mode" "${APP_MODE}" ${APP_PROP_FILE_PATH}
  findAndReplace "data.export.dir" "${APP_DATA_EXPORTS_DIR}" ${APP_PROP_FILE_PATH}
  findAndReplace "data.import.demo-data" "${APP_DEMO_DATA}" ${APP_PROP_FILE_PATH}
  findAndReplace "data.upload.dir" "${APP_DATA_ATTACHMENTS_DIR}" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.ddl" "update" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.driver" "org.postgresql.Driver" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.password" "${PGPASSWORD}" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.url" "jdbc:postgresql://${PGHOST}:5432/${PGDATABASE}" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.user" "${PGUSER}" ${APP_PROP_FILE_PATH}
  findAndReplace "hibernate.hikari.maximumPoolSize" "20" ${APP_PROP_FILE_PATH}
  findAndReplace "hibernate.hikari.minimumIdle" "1" ${APP_PROP_FILE_PATH}
  findAndReplace "hibernate.search.default.directory_provider" "none" ${APP_PROP_FILE_PATH}
  findAndReplace "logging.level.com.axelor" "${LOG_LEVEL}" ${APP_PROP_FILE_PATH}
  findAndReplace "quartz.enable" "${ENABLE_QUARTZ}" ${APP_PROP_FILE_PATH}
  findAndReplace "temp.dir" "{java.io.tmpdir}" ${APP_PROP_FILE_PATH}
  findAndReplace "encryption.password" "${ENCRYPTION_PASSWORD}" ${APP_PROP_FILE_PATH}
}

findAndReplace() {
  PROP=$1
  VALUE=$2
  FILE=$3

  if grep -q "${PROP}" ${FILE}; then
    sed -i "s|^${PROP}.*|${PROP} = ${VALUE}|" ${FILE}
  else
    echo "\n${PROP} = ${VALUE}" >> ${FILE}
  fi
}

update_properties

if [ "$1" = "start" ]; then
  shift

  if [ ! -f ${APP_DATA_BASE_DIR}/.first_start_completed ]; then
    wait_for_postgres
    init_postgres
    init_tomcat
    touch ${APP_DATA_BASE_DIR}/.first_start_completed
  fi

  exec ${CATALINA_HOME}/bin/catalina.sh run
fi

exec "$@"
