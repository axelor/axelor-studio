#!/bin/ash
set -e

APP_USER="${APP_USER:-admin}"
APP_PASS="${APP_PASS:-admin}"

PGHOST="${PGHOST:-postgres}"
PGUSER="${PGUSER:-axelor}"
PGPASSWORD="${PGPASSWORD:-axelor}"
PGDATABASE="${PGDATABASE:-axelor}"

APP_LANGUAGE="${APP_LANGUAGE:-en}"
APP_DEMO_DATA="${APP_DEMO_DATA:-true}"
APP_LOAD_APPS="${APP_LOAD_APPS:-true}"
DEV_MODE="${DEV_MODE:-false}"

APP_DATA_BASE_DIR="/app/data"
APP_DATA_EXPORTS_DIR="${APP_DATA_EXPORTS_DIR:-$APP_DATA_BASE_DIR/exports}"
APP_DATA_ATTACHMENTS_DIR="${APP_DATA_ATTACHMENTS_DIR:-$APP_DATA_BASE_DIR/attachments}"

mkdir -p ${APP_DATA_EXPORTS_DIR} ${APP_DATA_ATTACHMENTS_DIR}

# Initialize tomcat
init_tomcat() {
  echo "Configuring app:tomcat 🔧"

  local TOMCAT_ENV_PATH=${CATALINA_HOME}/bin/setenv.sh
  local TOMCAT_SERVER_PATH=${CATALINA_HOME}/conf/server.xml

  # Add setenv.sh
  cat > ${TOMCAT_ENV_PATH} <<EOF
export CATALINA_PID="\$CATALINA_BASE/tomcat.pid"
export JAVA_OPTS="\$JAVA_OPTS -Xms${JAVA_XMS:-2G} -Xmx${JAVA_XMX:-2G} -server ${AX_JAVA_OPTS}"
EOF

  # Remove localhost_access_log
  sed -i -E ':a;N;$!ba;s/<Valve className=\"org.apache.catalina.valves.AccessLogValve\"(.|\n)*\/>//' $TOMCAT_SERVER_PATH
}

# Wait for Postgres
wait_for_postgres() {
  local retries=5
  until psql --command "SELECT 1" > /dev/null 2>&1 || [ ${retries} -eq 0 ]; do
    echo "Waiting for postgres server, $((retries--)) remaining attempts..."
    sleep 3
  done

  if [ ${retries} -eq 0 ]; then
    echo "Impossible to contact PostgreSQL"
  else
    echo "Postgresql Ready"
  fi
}

# Initialize database
init_postgres() {
  if [[ -z "$(psql -t --command "SELECT extname FROM pg_extension WHERE extname = 'unaccent'";)" ]]; then
    echo "Configuring app:database 🔧"
    psql --command "CREATE EXTENSION IF NOT EXISTS unaccent"
  fi
}

# Update app properties
update_properties() {
  echo "Configuring app:properties 🔧"

  local APP_PROP_FILE_PATH="${CATALINA_HOME}/webapps/ROOT/WEB-INF/classes/axelor-config.properties"
  local APP_MODE="prod"
  local LOG_LEVEL="INFO"
  if [[ ${DEV_MODE} == true ]]; then
    APP_MODE="dev"
    LOG_LEVEL="DEBUG"
  fi

  findAndReplace "aos.apps.install-apps" "none" ${APP_PROP_FILE_PATH}
  findAndReplace "application.mode" "${APP_MODE}" ${APP_PROP_FILE_PATH}
  findAndReplace "data.export.dir" "${APP_DATA_EXPORTS_DIR}" ${APP_PROP_FILE_PATH}
  findAndReplace "data.import.demo-data" "${APP_DEMO_DATA}" ${APP_PROP_FILE_PATH}
  findAndReplace "data.upload.dir" "${APP_DATA_ATTACHMENTS_DIR}" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.ddl" "update" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.driver" "org.postgresql.Driver" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.password" "${PGPASSWORD}" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.url" "jdbc:postgresql://${PGHOST}:5432/${PGDATABASE}" ${APP_PROP_FILE_PATH}
  findAndReplace "db.default.user" "${PGUSER}" ${APP_PROP_FILE_PATH}
  findAndReplace "hibernate.hikari.maximumPoolSize" "10" ${APP_PROP_FILE_PATH}
  findAndReplace "hibernate.hikari.minimumIdle" "1" ${APP_PROP_FILE_PATH}
  findAndReplace "hibernate.search.default.directory_provider" "none" ${APP_PROP_FILE_PATH}
  findAndReplace "logging.level.com.axelor" "${LOG_LEVEL}" ${APP_PROP_FILE_PATH}
  findAndReplace "quartz.enable" "false" ${APP_PROP_FILE_PATH}
  findAndReplace "temp.dir" "{java.io.tmpdir}" ${APP_PROP_FILE_PATH}
}

# Start Tomcat
start_tomcat() {
  echo "Initializing app... ✨"

  ${CATALINA_HOME}/bin/catalina.sh start >/dev/null &

  if [[ ${DEV_MODE} == true ]]; then
    # Wait tomcat.pid to be written
    sleep 2
    tail --pid $(cat ${CATALINA_HOME}/tomcat.pid) -F ${CATALINA_HOME}/logs/catalina.out &
  fi

  sleep 5

  check_tomcat_app_available
}

# Stop Tomcat
stop_tomcat() {
  echo "Stopping app... ⛔"

  ${CATALINA_HOME}/bin/catalina.sh stop 15 -force >/dev/null
  sleep 5
}

# Install all apps
install_apps() {
  if [[ ${APP_LOAD_APPS} == true ]]; then
    apk add jq

    echo "Loading demo data... 📥"

    # Login
    curl -sS -o /dev/null --cookie-jar /tmp/cookies.txt -X POST -H "Content-Type:application/json" \
      -d '{"username":"'"${APP_USER}"'","password":"'"${APP_PASS}"'"}' \
      http://localhost:8080/callback

    # Get all apps with id and version
    local APPS=$(curl -sS --cookie /tmp/cookies.txt -X GET -H "Content-Type: application/json" \
      http://localhost:8080/ws/rest/com.axelor.studio.db.App | jq '[.data[] | {id: .id, version: .version}]')

    local DATA=$(cat <<EOF
{"action": "action-app-method-bulk-install",
  "data": {
    "context": {
    "languageSelect": "${APP_LANGUAGE}",
    "importDemoData": ${APP_DEMO_DATA},
    "_model": "com.axelor.studio.db.App",
    "appsSet": ${APPS}
  }
},
"model": "com.axelor.studio.db.App"}
EOF
)

    # Execute action
    curl -sS --cookie /tmp/cookies.txt --max-time 1800 -X POST -H "Content-Type: application/json" \
      -d ''"${DATA}"'' \
      http://localhost:8080/ws/action >/dev/null

    rm /tmp/cookies.txt

  fi
}

check_tomcat_app_available() {
  local counter=1
  local command="curl --connect-timeout 5 --fail -s -o /dev/null -w %{http_code} -X GET http://localhost:8080/"
  local code
  code=$(eval "${command}")
  until [[ "$code" == "200" ]] || [ "${counter}" -gt 30 ]; do
    echo "Waiting 20sec for Tomcat to be ready, attempt $((counter++))"
    sleep 20
  done

  if [ "$counter" -gt 30 ]; then
    echo
    echo "ERROR: "
    echo "  Unable to reach instance. (code: ${code})"
    echo "  Seems app has not starting or still loading."
    echo "  Aborting... 🧨"
    echo
    exit 1
  fi
}

# Update a property
findAndReplace() {
  local PROP=$1
  local VALUE=$2
  local FILE=$3

  if grep -q "${PROP}" ${FILE}; then
    sed -i "s/^${PROP}.*/${PROP} = $(echo "${VALUE}" | sed 's/\//\\\//g')/" ${FILE}
  else
    echo -e "\n${PROP} = ${VALUE}" >> ${FILE}
  fi
}

update_properties

if [ "$1" = "start" ]; then
  shift

  if [[ ! -f ${APP_DATA_BASE_DIR}/.first_start_completed ]]; then
    wait_for_postgres
    init_postgres
    init_tomcat
    start_tomcat
    install_apps
    stop_tomcat
    touch ${APP_DATA_BASE_DIR}/.first_start_completed
  fi

  exec ${CATALINA_HOME}/bin/catalina.sh run
fi

exec "$@"
