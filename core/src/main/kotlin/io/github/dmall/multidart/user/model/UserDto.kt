package io.github.dmall.multidart.user.model

import jakarta.validation.constraints.NotBlank

data class UserDto(

    @NotBlank
    val username: String,

    @NotBlank
    var password: String,
)