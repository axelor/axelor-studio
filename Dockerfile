FROM axelor/app-builder:8.0 AS builder

ARG JAVA_OPTS="-Xmx4g"
ARG APP_SOURCE="/app/axelor-public-webapp"
ARG DEBIAN_FRONTEND="noninteractive"
ARG MODULE_NAME="axelor-studio"

ARG NEXUS_READER_USERNAME
ARG NEXUS_READER_PASSWORD

COPY . /${MODULE_NAME}
WORKDIR /
RUN if [ ! -f ${MODULE_NAME}/app.tar ]; then echo "app.tar webapp archive not found. Exiting."; exit 1; fi
RUN mv ${MODULE_NAME}/app.tar .
RUN tar xf app.tar
RUN mv ${MODULE_NAME} ${APP_SOURCE}/modules
WORKDIR ${APP_SOURCE}

RUN chmod +x gradlew && \
    ./gradlew --no-daemon build -xtest -xcheck -PaxelorMavenUsername=${NEXUS_READER_USERNAME} -PaxelorMavenPassword=${NEXUS_READER_PASSWORD}
RUN mkdir -p ${APP_SOURCE}/webapps/ROOT && \
    unzip -q -o ${APP_SOURCE}/build/libs/*.war -d ${APP_SOURCE}/webapps/ROOT/


# Image to run tomcat with axelor-app
FROM eclipse-temurin:21-jre-alpine

ARG BUILD_DATE
ARG TOMCAT_VERSION=10.1.43
ARG MODULE_NAME="axelor-studio"
ARG PROJECT_VENDOR="Axelor"

ARG APP_LANGUAGE
ARG APP_DEMO_DATA
ARG APP_LOAD_APPS
ARG DEV_MODE
ARG ENABLE_QUARTZ

ENV CATALINA_HOME="/usr/local/tomcat"

ENV APP_LANGUAGE=${APP_LANGUAGE}
ENV APP_DEMO_DATA=${APP_DEMO_DATA}
ENV APP_LOAD_APPS=${APP_LOAD_APPS}
ENV DEV_MODE=${DEV_MODE}
ENV ENABLE_QUARTZ=${ENABLE_QUARTZ}

# System Upgrade for security reasons + install tools needed by the entrypoint
RUN apk upgrade && \
    apk add --no-cache coreutils curl postgresql-client

# Install Tomcat
RUN export TOMCAT_MINOR_VERSION=$(echo ${TOMCAT_VERSION} | cut -d"." -f 1) && \
    mkdir -p ${CATALINA_HOME} && \
	  curl -L https://archive.apache.org/dist/tomcat/tomcat-${TOMCAT_MINOR_VERSION}/v${TOMCAT_VERSION}/bin/apache-tomcat-${TOMCAT_VERSION}.tar.gz | tar xvzf - --exclude="apache-tomcat*/webapps/*" --strip-components=1 --directory=${CATALINA_HOME}



# Copy app
COPY --from=builder /app/axelor-public-webapp/webapps ${CATALINA_HOME}/webapps

# Expose ports
EXPOSE 8080

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Label images
LABEL \
	maintainer="Axelor <support@axelor.com>" \
	org.label-schema.schema-version="1.0" \
	org.label-schema.build-date="${BUILD_DATE}" \
	org.label-schema.name="${MODULE_NAME}" \
	org.label-schema.vendor="${PROJECT_VENDOR}"

# Entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["start"]