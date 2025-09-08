package io.github.dmall.opendarts.game.validation

import io.github.dmall.opendarts.game.model.DartThrowRequest
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [DartThrowRequestValidator::class])
annotation class ValidDartThrowRequest(
    val message: String = "Invalid DartThrowRequest",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class DartThrowRequestValidator : ConstraintValidator<ValidDartThrowRequest, DartThrowRequest> {
    override fun isValid(value: DartThrowRequest?, context: ConstraintValidatorContext): Boolean {
        if (value == null) return true

        val multiplierValid = value.multiplier in 1..3
        val scoreValid = (value.score in 0..20) || (value.score == 25)
        val tripleBullInvalid = value.multiplier == 3 && value.score == 25

        if (!multiplierValid) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate("Multiplier must be between 1 and 3")
                .addPropertyNode("multiplier").addConstraintViolation()
            return false
        }

        if (!scoreValid) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate("Score must be 0-20 or exactly 25")
                .addPropertyNode("score").addConstraintViolation()
            return false
        }

        if (tripleBullInvalid) {
            context.disableDefaultConstraintViolation()
            context.buildConstraintViolationWithTemplate("Multiplier cannot be 3 when score is 25")
                .addPropertyNode("score").addConstraintViolation()
            return false
        }

        return true
    }

}