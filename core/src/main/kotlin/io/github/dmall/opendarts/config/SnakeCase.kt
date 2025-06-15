package io.github.dmall.opendarts.config

import org.springframework.beans.factory.annotation.Qualifier

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@Qualifier
annotation class SnakeCase()