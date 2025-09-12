FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY pom.xml .
COPY core/pom.xml ./core/

RUN mvn dependency:go-offline -B

COPY core/src ./core/src

RUN mvn clean package -DskipTests -B && \
    rm -rf ~/.m2/repository

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001 -G spring && \
    apk --no-cache add dumb-init

WORKDIR /app

COPY --from=build --chown=spring:spring /app/core/target/*.jar app.jar

USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["dumb-init", "java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
